# WORKFLOW QUEUE ERROR
resource "aws_sqs_queue" "workflow_queue_error" {
  name = "WORKFLOW_QUEUE_ERROR"
}


# WORKFLOW QUEUE 
resource "aws_sqs_queue" "workflow_queue" {
  name = "WORKFLOW_QUEUE"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.workflow_queue_error.arn
    maxReceiveCount     = 4
  })
  policy = <<EOF
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Action": [
                    "sqs:SendMessage",
                    "sqs:GetQueueAttributes",
                    "sqs:GetQueueUrl"
                ],
                "Resource": "arn:aws:sqs:ap-southeast-2:917209780752:WORKFLOW_QUEUE",
                "Condition": {
                    "ArnLike": {
                        "aws:SourceArn": "arn:aws:events:ap-southeast-2:917209780752:rule/Delay*Rule"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Action": [
                    "sqs:SendMessage",
                    "sqs:GetQueueAttributes",
                    "sqs:GetQueueUrl"
                ],
                "Resource": "arn:aws:sqs:ap-southeast-2:917209780752:WORKFLOW_QUEUE",
                "Condition": {
                    "ArnLike": {
                        "aws:SourceArn": "arn:aws:events:ap-southeast-2:917209780752:rule/Timed.*.Rule"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Action": [
                    "sqs:SendMessage",
                    "sqs:GetQueueAttributes",
                    "sqs:GetQueueUrl"
                ],
                "Resource": "arn:aws:sqs:ap-southeast-2:917209780752:WORKFLOW_QUEUE",
                "Condition": {
                    "ArnEquals": {
                        "aws:SourceArn": "arn:aws:events:ap-southeast-2:917209780752:rule/rule-coredocs-workflow-api-dev"
                    }
                }
            },
            {
                "Sid": "AWSEvents_rule-lambdas-workflow-api-dev_Ide64f7e88-d7b2-412d-911c-ee19dfdfe1db",
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Action": "sqs:SendMessage",
                "Resource": "arn:aws:sqs:ap-southeast-2:917209780752:WORKFLOW_QUEUE",
                "Condition": {
                    "ArnEquals": {
                        "aws:SourceArn": "arn:aws:events:ap-southeast-2:917209780752:rule/rule-lambdas-workflow-api-dev"
                    }
                }
            }
        ]
    }
    EOF
}
