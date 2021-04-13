import * as AWS from 'aws-sdk';
import { ConfigUtil } from '../config.util';

const config = {
  endpoint: new AWS.Endpoint(ConfigUtil.get('sqs.endpoint')),
  region: ConfigUtil.get('aws.region'),
};

export const SQS = new AWS.SQS(config);

export const QUEUE_NAME = ConfigUtil.get('sqs.queueName');
export const WORKFLOW_QUEUE_URL = ConfigUtil.get('sqs.queueUrl');

export const defaultListParams = {};

export const defaultCreateParams = {
  QueueName: QUEUE_NAME,
  Attributes: {
    DelaySeconds: '60',
    MessageRetentionPeriod: '86400',
  },
};

export const defaultSendMessageParams = (msg: string = '') => {
  return {
    // Remove DelaySeconds parameter and value for FIFO queues
    DelaySeconds: 10,
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
  VisibilityTimeout: 20,
  WaitTimeSeconds: 0,
};
