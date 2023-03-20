data "aws_route53_zone" "hosted_zone" {
  name = var.route53_domain_name
}

resource "aws_route53_record" "workflow_api" {
  zone_id = data.aws_route53_zone.hosted_zone.zone_id
  name    = "workflow-api.${var.route53_domain_name}"
  type    = "A"
  alias {
    name = aws_lb.api.dns_name
    zone_id = aws_lb.api.zone_id
    evaluate_target_health = true
  }
}