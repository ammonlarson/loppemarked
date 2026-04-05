variable "aws_region" {
  description = "AWS region for the state backend resources."
  type        = string
  default     = "eu-north-1"
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform remote state."
  type        = string
  default     = "greenspace-2026-tfstate"
}

variable "lock_table_name" {
  description = "Name of the DynamoDB table for Terraform state locking."
  type        = string
  default     = "greenspace-2026-tflock"
}
