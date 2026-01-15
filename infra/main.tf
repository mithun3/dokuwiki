terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

backend "s3" {
  bucket         = "sysya-bucket-001"
  key            = "dokuwiki/terraform.tfstate"
  region         = "ap-southeast-2"
  dynamodb_table = "tf-locks"
  encrypt        = true
}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# CloudFront/ACM for CF require us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

module "network" {
  source               = "./modules/network"
  name                 = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  azs                  = var.availability_zones
}

module "efs" {
  source               = "./modules/efs"
  name                 = local.name_prefix
  vpc_id               = module.network.vpc_id
  subnet_ids           = module.network.private_subnet_ids
  security_group_ids   = []
  ingress_security_groups = []
  ingress_cidr_blocks  = []
  backup_policy        = true
}

module "alb" {
  source      = "./modules/alb"
  name        = local.name_prefix
  vpc_id      = module.network.vpc_id
  subnet_ids  = module.network.public_subnet_ids
  enable_https    = var.hosted_zone_id != "" && length(aws_acm_certificate_validation.main) > 0
  certificate_arn  = length(aws_acm_certificate_validation.main) > 0 ? aws_acm_certificate_validation.main[0].certificate_arn : ""
  enable_waf       = false
  waf_web_acl_arn  = ""
}

module "ecs" {
  source                = "./modules/ecs_fargate"
  name                  = local.name_prefix
  vpc_id                = module.network.vpc_id
  private_subnet_ids    = module.network.private_subnet_ids
  container_image       = var.container_image
  alb_target_group_arn  = module.alb.target_group_arn
  alb_security_group_id = module.alb.alb_security_group_id
  efs_file_system_id    = module.efs.file_system_id
  efs_security_group_id = module.efs.security_group_id
  env_vars = {
    PHP_MEMORY_LIMIT = "256M"
    DEMO_USERS       = "0"
  }
  secret_env = var.admin_password_ssm_arn == "" ? {} : {
    ADMIN_PASSWORD = var.admin_password_ssm_arn
  }
}

module "media_cdn" {
  source = "./modules/media_cdn"
  providers = {
    aws          = aws
    aws.us_east_1 = aws.us_east_1
  }

  name             = local.name_prefix
  bucket_name      = var.media_bucket_name
  domain_name      = var.media_domain_name
  hosted_zone_id   = var.media_hosted_zone_id != "" ? var.media_hosted_zone_id : var.hosted_zone_id
  certificate_arn  = var.media_certificate_arn
}

# Allow ECS tasks to reach EFS over NFS without opening to the entire VPC
resource "aws_security_group_rule" "efs_from_tasks" {
  type                     = "ingress"
  from_port                = 2049
  to_port                  = 2049
  protocol                 = "tcp"
  security_group_id        = module.efs.security_group_id
  source_security_group_id = module.ecs.task_security_group_id
}

resource "aws_acm_certificate" "main" {
  count              = var.domain_name == "" ? 0 : 1
  domain_name        = var.domain_name
  validation_method  = "DNS"
  lifecycle { create_before_destroy = true }
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_name == "" || var.hosted_zone_id == "" ? {} : {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => dvo
  }

  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  zone_id = var.hosted_zone_id
  records = [each.value.resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "main" {
  count                   = var.domain_name == "" || var.hosted_zone_id == "" ? 0 : 1
  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

resource "aws_route53_record" "app" {
  count   = var.domain_name == "" || var.hosted_zone_id == "" ? 0 : 1
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
}

output "alb_dns_name" { value = module.alb.alb_dns_name }
output "efs_id" { value = module.efs.file_system_id }
output "cluster_id" { value = module.ecs.cluster_id }
output "media_bucket" { value = module.media_cdn.bucket_name }
output "media_cdn_domain" { value = module.media_cdn.cdn_domain }
output "app_cert_validation_records" {
  value = var.domain_name == "" ? [] : tolist(aws_acm_certificate.main[0].domain_validation_options)
}
