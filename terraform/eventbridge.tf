# EB Rule for workflow-api
resource "aws_cloudwatch_event_rule" "workflow_api_rule" {
name = "rule-lambdas-workflow-api-dev"

event_pattern = <<EOF
  {
    "detail-type": ["service::workflow-engine::run-workflowStep"],
    "source": ["workflow.engine"]
  }
  EOF
}

resource "aws_cloudwatch_event_target" "api_sns" {
  rule      = aws_cloudwatch_event_rule.workflow_api_rule.name
  arn       = aws_sqs_queue.workflow_queue.arn
}