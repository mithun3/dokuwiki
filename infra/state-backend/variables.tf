variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "dokuwiki"
}

variable "state_bucket_name" {
  description = "S3 bucket name for TF state"
  type        = string
  default     = "dokuwiki-tfstate-bucket"
}

variable "lock_table_name" {
  description = "DynamoDB table name for TF locks"
  type        = string
  default     = "tf-locks"
}

variable "state_key" {
  description = "Key path for the tfstate object (e.g., dokuwiki/terraform.tfstate)"
  type        = string
  default     = "dokuwiki/terraform.tfstate"
}
