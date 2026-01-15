variable "name" {
	description = "Name prefix"
	type        = string
}

variable "bucket_name" {
	description = "S3 bucket name for media"
	type        = string
}

variable "domain_name" {
	description = "Media CDN FQDN (e.g., media.example.com)"
	type        = string
}

variable "hosted_zone_id" {
	description = "Route53 hosted zone ID for media domain"
	type        = string
}

variable "price_class" {
	description = "CloudFront price class"
	type        = string
	default     = "PriceClass_100"
}

variable "allowed_origins" {
	description = "CORS allowed origins"
	type        = list(string)
	default     = ["*"]
}

variable "certificate_arn" {
	description = "ACM cert ARN for CloudFront (us-east-1). If empty, one is created."
	type        = string
	default     = ""
}
