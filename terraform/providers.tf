# BACKEND for remote state file
# terraform {
#   backend "s3" {
#     bucket = "workflow-tf-state-bucket"
#     key = "workflow-api/terraform.tfstate"
#     region = "ap-southeast-2"
#     encrypt = true
#     dynamodb_table = "terraform-lock"
#   }
# }
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "4.34.0"
    }
  }
  backend "s3" {
    bucket = "workflow-tf-state-bucket"
    key = "workflow-api/terraform.tfstate"
    region = "ap-southeast-2"
    encrypt = true
    dynamodb_table = "terraform-lock"
  }
}



provider "aws" {
  region = var.region
}

