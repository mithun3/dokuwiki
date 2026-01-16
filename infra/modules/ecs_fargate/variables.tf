variable "name" {
  description = "Name prefix"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets"
  type        = list(string)
}

variable "container_image" {
  description = "Container image URI"
  type        = string
}

variable "cpu" {
  description = "Task CPU"
  type        = number
  default     = 512
}

variable "memory" {
  description = "Task memory"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Service desired count"
  type        = number
  default     = 1
}

variable "alb_target_group_arn" {
  description = "Target group ARN"
  type        = string
}

variable "alb_security_group_id" {
  description = "ALB SG ID"
  type        = string
}

variable "efs_file_system_id" {
  description = "EFS ID"
  type        = string
}

variable "efs_security_group_id" {
  description = "EFS SG ID"
  type        = string
}

variable "env_vars" {
  description = "Plain env vars"
  type        = map(string)
  default     = {}
}

variable "secret_env" {
  description = "Map of name -> SSM/Secrets ARN"
  type        = map(string)
  default     = {}
}

variable "efs_access_point_data_id" {
  description = "EFS Access Point ID for data directory"
  type        = string
}

variable "efs_access_point_conf_id" {
  description = "EFS Access Point ID for conf directory"
  type        = string
}

variable "efs_access_point_plugins_id" {
  description = "EFS Access Point ID for plugins directory"
  type        = string
}
