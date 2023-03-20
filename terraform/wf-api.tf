data "template_file" "wf-api" {
  template = file("./template/template.json.tpl")
  vars = {
    name = "wf-api"
    app_image = var.wf_api_image
    tag = var.wf_api_image_tag
    app_port = 3001
    fargate_cpu = var.fargate_cpu
    fargate_memory = var.fargate_memory
    aws_region = var.region
  }
}

data "aws_iam_role" "role" {
  name = var.iam_role_name
}

data "aws_ecs_cluster" "cluster" {
  cluster_name = var.ecs_cluster_name
}

resource "aws_ecs_task_definition" "wf_api_task_def" {
  family = "wf-api-family"
  execution_role_arn = data.aws_iam_role.role.arn
  network_mode = "awsvpc"
  requires_compatibilities = [ "FARGATE" ]
  cpu = var.fargate_cpu
  memory = var.fargate_memory
  container_definitions = data.template_file.wf-api.rendered
}

resource "aws_ecs_service" "wf-api-svc" {
  name = "test-wf-api-service"
  cluster = data.aws_ecs_cluster.cluster.arn
  deployment_maximum_percent = 200
  deployment_minimum_healthy_percent = 0
  desired_count = 1
  launch_type = "FARGATE"
  task_definition = aws_ecs_task_definition.wf_api_task_def.arn
  network_configuration {
    security_groups = [aws_security_group.sg_ecs_wf_api.id]
    subnets = var.private_subnet_ids
    assign_public_ip = true
  }
  load_balancer {
    container_port = 3001
    container_name = "wf-api"
    target_group_arn = aws_lb_target_group.app-api.arn
  }
  depends_on = [aws_lb_target_group.app-api]
}


