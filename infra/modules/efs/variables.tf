variable "name" {
  description = "Name prefix"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnets for mount targets"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Extra SGs for EFS"
  type        = list(string)
  default     = []
}

variable "ingress_security_groups" {
  description = "Security groups allowed to access EFS"
  type        = list(string)
  default     = []
}

variable "ingress_cidr_blocks" {
  description = "CIDR blocks allowed to access EFS"
  type        = list(string)
  default     = []
}

variable "performance_mode" {
  description = "EFS performance mode"
  type        = string
  default     = "generalPurpose"
}

variable "throughput_mode" {
  description = "EFS throughput mode"
  type        = string
  default     = "bursting"
}

variable "backup_policy" {
  description = "Enable AWS Backup"
  type        = bool
  default     = false
}
