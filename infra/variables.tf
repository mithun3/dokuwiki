variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Logical project name for tagging"
  type        = string
  default     = "dokuwiki"
}

variable "environment" {
  description = "Environment label (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "availability_zones" {
  description = "AZs to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "domain_name" {
  description = "FQDN for the wiki"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "container_image" {
  description = "ECR image URI"
  type        = string
  default     = ""
}

variable "admin_password_ssm_arn" {
  description = "SSM parameter ARN for ADMIN_PASSWORD"
  type        = string
  default     = ""
}

variable "media_domain_name" {
  description = "FQDN for media CDN (e.g., media.example.com)"
  type        = string
  default     = ""
}

variable "media_hosted_zone_id" {
  description = "Route53 hosted zone ID for media domain (defaults to hosted_zone_id if empty)"
  type        = string
  default     = ""
}

variable "media_certificate_arn" {
  description = "ACM cert ARN (us-east-1) for media CDN. Leave empty to use default CloudFront cert."
  type        = string
  default     = ""
}

variable "media_bucket_name" {
  description = "S3 bucket name for media"
  type        = string
  default     = ""
}
