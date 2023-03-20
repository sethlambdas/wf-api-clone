# BACKEND for remote state file
terraform {
  backend "s3" {
    bucket = "workflow-tf-state-bucket"
    key = "workflow-api/terraform.tfstate"
    region = "ap-southeast-2"
    encrypt = true
    dynamodb_table = "terraform-lock"
  }
}


provider "aws" {
  version = "4.34.0"
  region = var.region
  profile = var.aws_profile
}