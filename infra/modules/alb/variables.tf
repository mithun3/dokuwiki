variable "name" {
  description = "Name prefix"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Public subnets for ALB"
  type        = list(string)
}

variable "certificate_arn" {
  description = "ACM cert ARN for HTTPS"
  type        = string
  default     = ""
}

variable "enable_https" {
  description = "Whether to create HTTPS listener"
  type        = bool
  default     = false
}

variable "enable_waf" {
  description = "Associate WAF Web ACL"
  type        = bool
  default     = false
}

variable "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  type        = string
  default     = ""
}
