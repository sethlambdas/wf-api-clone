# ALB FOR WORKFLOW-API
resource "aws_lb" "api" {
  name = "wf-loadbalancer-api"
  load_balancer_type = "application"
  ip_address_type = "ipv4"
  subnets = var.public_subnet_ids
  security_groups = [ data.aws_security_group.sg_lb.id ]
  tags = {
    "Name" = "aws_alb_wf"
  }
}

resource "aws_lb_target_group" "app-api" {
  name = "wf-lb-target-group-api"
  port = 3001
  protocol = "HTTP"
  vpc_id = data.aws_subnet.private.vpc_id
  target_type = "ip"
  protocol_version = "HTTP1"

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 60
    protocol = "HTTP"
    matcher = "200"
    path = "/api/health"
    interval = 120
  }
}

# redirecting all incoming traffic from ALB to the target group
resource "aws_lb_listener" "alb_listener-api" {
  load_balancer_arn = aws_lb.api.arn
  port = 80
  protocol = "HTTP"
  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.app-api.arn
  }
}

resource "aws_lb_listener" "alb_listener-api-https" {
  load_balancer_arn = aws_lb.api.arn
  port = 443
  protocol = "HTTPS"
  certificate_arn = var.ssl_cert_arn
  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.app-api.arn
  }
}