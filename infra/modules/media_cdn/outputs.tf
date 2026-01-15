output "bucket_name" { value = aws_s3_bucket.media.bucket }
output "cdn_domain" {
	value = var.domain_name != "" && var.certificate_arn != "" ? var.domain_name : aws_cloudfront_distribution.cdn.domain_name
}
output "cloudfront_domain" { value = aws_cloudfront_distribution.cdn.domain_name }
output "cdn_cert_validation_records" {
	value = (var.domain_name != "" && var.hosted_zone_id != "") ? tolist(aws_acm_certificate.cf[0].domain_validation_options) : []
}
