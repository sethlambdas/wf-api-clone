resource "aws_ecr_repository" "main" {
  name                 = var.wf_api_ecr_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    "Name" = var.wf_api_ecr_name
  }
}


output "repository_url" {
  value = aws_ecr_repository.main.repository_url
}