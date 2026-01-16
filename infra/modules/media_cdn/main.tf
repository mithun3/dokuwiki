locals {
  manage_cert           = var.certificate_arn == "" && var.domain_name != "" && var.manage_dns
  use_custom_cert       = var.certificate_arn != ""
  custom_domain_enabled = var.domain_name != "" && (var.certificate_arn != "" || local.manage_cert)
  viewer_cert_arn       = local.manage_cert ? aws_acm_certificate.cf[0].arn : var.certificate_arn
}

resource "aws_s3_bucket" "media" {
  bucket        = var.bucket_name
  force_destroy = false

  tags = { Name = "${var.name}-media" }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = var.allowed_origins
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 86400
  }
}

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.name}-media-oac"
  description                       = "OAC for media bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_acm_certificate" "cf" {
  provider          = aws.us_east_1
  count             = local.manage_cert ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.manage_cert ? {
    for dvo in aws_acm_certificate.cf[0].domain_validation_options : dvo.domain_name => dvo
  } : {}

  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  zone_id = var.hosted_zone_id
  records = [each.value.resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "cf" {
  provider                = aws.us_east_1
  count                   = local.manage_cert ? 1 : 0
  certificate_arn         = aws_acm_certificate.cf[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  comment             = "${var.name} media CDN"
  default_root_object = ""

  aliases = local.custom_domain_enabled ? [var.domain_name] : []

  origin {
    domain_name = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id   = "media-origin"

    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = "media-origin"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
  }

  price_class = var.price_class

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = local.custom_domain_enabled ? local.viewer_cert_arn : null
    cloudfront_default_certificate = !local.custom_domain_enabled
    ssl_support_method             = local.custom_domain_enabled ? "sni-only" : null
    minimum_protocol_version       = local.custom_domain_enabled ? "TLSv1.2_2021" : null
  }
}

resource "aws_s3_bucket_policy" "media" {
  bucket = aws_s3_bucket.media.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = ["s3:GetObject"]
        Resource  = "${aws_s3_bucket.media.arn}/*"
        Condition = {
          StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn }
        }
      }
    ]
  })
}

resource "aws_route53_record" "media" {
  count   = local.custom_domain_enabled && var.manage_dns ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}
