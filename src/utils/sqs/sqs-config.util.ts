import * as AWS from 'aws-sdk';
import { ConfigUtil } from '../config.util';

const config: { [key: string]: any } = {
  region: ConfigUtil.get('aws.region'),
};

if (process.env.NODE_ENV === 'development') {
  config.endpoint = new AWS.Endpoint(ConfigUtil.get('sqs.endpoint'));
}

export const SQS = new AWS.SQS(config);
export const QUEUE_NAME = ConfigUtil.get('sqs.queueName');
export const WORKFLOW_QUEUE_URL = ConfigUtil.get('sqs.queueUrl');

export const QUEUE_ERROR = ConfigUtil.get('sqs.queueError');
export const WORKFLOW_QUEUE_URL_ERROR = ConfigUtil.get('sqs.queueErrorUrl');

export const defaultListParams = {};

export const defaultCreateParams = (errorTargetArn: string): AWS.SQS.Types.CreateQueueRequest => {
  return {
    QueueName: QUEUE_NAME,
    Attributes: {
      DelaySeconds: '0',
      MessageRetentionPeriod: '86400',
      RedrivePolicy: JSON.stringify({
        deadLetterTargetArn: errorTargetArn,
        maxReceiveCount: +ConfigUtil.get('sqs.maxRetriesLimit') + 1,
      }),
    },
  };
};

export const defaultSendMessageParams = (msg: string = ''): AWS.SQS.Types.SendMessageRequest => {
  return {
    // Remove DelaySeconds parameter and value for FIFO queues
    DelaySeconds: 0,
    MessageAttributes: {
      Title: {
        DataType: 'String',
        StringValue: 'The Whistler',
      },
      Author: {
        DataType: 'String',
        StringValue: 'John Grisham',
      },
      WeeksOn: {
        DataType: 'Number',
        StringValue: '6',
      },
    },
    MessageBody: msg,
    // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
    // MessageGroupId: "Group1",  // Required for FIFO queues
    QueueUrl: WORKFLOW_QUEUE_URL,
  };
};

export const defaultReceiveMessageParams = {
  AttributeNames: ['SentTimestamp'],
  MaxNumberOfMessages: 10,
  MessageAttributeNames: ['All'],
  QueueUrl: WORKFLOW_QUEUE_URL,
  VisibilityTimeout: 0,
  WaitTimeSeconds: 0,
};
