data "aws_subnet" "private" {
  id = var.private_subnet_ids[0]
}

data "aws_security_group" "sg_lb" {
  name = var.sg_lb_name
}

# SG for ECS WF API (allow only inbound from WF UI)
resource "aws_security_group" "sg_ecs_wf_api" {
  name = "sg_wf_api"
  description = "Allow http inbound / outbound traffic from WF UI"
  vpc_id = data.aws_subnet.private.vpc_id

  ingress  {
    from_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    to_port = 3001
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    "Name" = "sg_ecs_wf_api"
  }

}