variable "region" {
  description = "AWS REGION"
  default = "ap-southeast-2"
}
variable "aws_profile" {
  description = "AWS profile configured in your machine"
  default = "lambdas"
}

variable "az_count" {
  description = "AZ Counts"
  default = 2
}

variable "wf_api_image" {
  description = "WF API image"
  default = "917209780752.dkr.ecr.ap-southeast-2.amazonaws.com/wf-api"
}

variable "wf_api_image_tag" {
  description = "WF API image"
  default = "latest"
}

variable "fargate_cpu" {
  description = "Fargate instance CPU units to provision (1vCPU = 1024 CPU units)"
  default = "1024"
}

variable "fargate_memory" {
  description = "Fargate instance memory to provision (in Mib)"
  default = "2048"
}

variable "ssl_cert_arn" {
  description = "SSL Certificate ARN"
  default = "arn:aws:acm:ap-southeast-2:917209780752:certificate/91321cd7-71b9-45f7-be91-4993a9e5be97"
}

variable "route53_domain_name" {
  description = "Route 53 hosted domain name"
  default = "lambdas.io"
}

variable "private_subnet_ids" {
  description = "Private Subnet Ids"
  default = ["subnet-08b21a8c8dd25c9e5","subnet-0071484dfa789ff75"]
}

variable "public_subnet_ids" {
  description = "Public Subnet Ids"
  default = ["subnet-047e6b5f9075f501c","subnet-0deb10641cd3f4c1c"]
}

variable "wf_api_ecr_name" {
  description = "Workflow ECR Name"
  default = "wf-api"
}

variable "sg_lb_name" {
  description = "Application Load Balancer Security Group Name"
  default = "sg_lb"
}

variable "iam_role_name" {
  description = "IAM Role name"
  default = "WFTaskExecutionRole2"
}

variable "ecs_cluster_name" {
  description = "ECS Cluster name"
  default = "wf-cluster"
}