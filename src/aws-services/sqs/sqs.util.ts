import { Logger } from '@nestjs/common';

import { ConfigUtil } from '@lambdascrew/utility';

import {
  defaultCreateParams,
  defaultListParams,
  defaultReceiveMessageParams,
  defaultSendMessageParams,
  SQS,
  WORKFLOW_QUEUE_URL,
} from './sqs-config.util';

const logger = new Logger('SQS');

export async function getQueueURL(queueName: string) {
  try {
    logger.log('Getting SQS Queue URL');
    const queueURL = await SQS.getQueueUrl({ QueueName: queueName }).promise();

    logger.log(queueURL);
    return queueURL;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

export async function deleteQueue(queueUrl: string) {
  try {
    logger.log('Deleting existing queue');
    const isDeleted = await SQS.deleteQueue({ QueueUrl: queueUrl }).promise();
    logger.log(isDeleted);
    return;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

// tslint:disable-next-line: class-name
interface ListSQSQueueInput {
  [key: string]: unknown;
}

export async function listSQSQueue(listParams?: ListSQSQueueInput) {
  try {
    logger.log('Listing SQS Queues');

    const queues = await SQS.listQueues(listParams || defaultListParams).promise();

    logger.log(queues);
    return queues;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

export async function getSQSQueueUrlDetail() {
  try {
    logger.log('Getting SQS Queue Detail');

    const queue = await SQS.getQueueUrl({ QueueName: ConfigUtil.get('sqs.queueName') }).promise();

    logger.log(queue);
    return queue;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

export async function getSQSQueueAttributes(QueueUrl: string) {
  try {
    logger.log('Getting SQS Queue Attributes');

    const queue = await SQS.getQueueAttributes({ QueueUrl, AttributeNames: ['All'] }).promise();

    logger.log(queue);
    return queue;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

// tslint:disable-next-line: class-name
interface ChangeSQSMessageVisibilityInput {
  QueueUrl: string;
  ReceiptHandle: string;
  VisibilityTimeout: number;
}

export async function changeSQSMessageVisibility(visibilityParams: ChangeSQSMessageVisibilityInput) {
  try {
    logger.log('Change SQS Message Visibility');

    const data = await SQS.changeMessageVisibility(visibilityParams).promise();

    logger.log(data);
    return data;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

// tslint:disable-next-line: class-name
interface CreateSQSQueueInput {
  QueueName: string;
  Attributes?: {
    DelaySeconds: string;
    MessageRetentionPeriod: string;
    RedrivePolicy: string;
  };
  [key: string]: unknown;
}

export async function createSQSQueue(createParams?: CreateSQSQueueInput, errorTargetArn?: string) {
  try {
    logger.log('Creating SQS Queue');

    const queue = await SQS.createQueue(createParams || defaultCreateParams(errorTargetArn)).promise();

    logger.log(queue);
    return queue;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

export async function sendMessageSQS(msg?: string) {
  try {
    logger.log('Sending Message SQS');

    const message = await SQS.sendMessage(defaultSendMessageParams(msg)).promise();

    logger.log(message);
    return message;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

// tslint:disable-next-line: class-name
interface ReceiveSQSQueueInput {
  AttributeNames: string[];
  MaxNumberOfMessages: number;
  MessageAttributeNames: string[];
  QueueUrl: string;
  VisibilityTimeout: number;
  WaitTimeSeconds: number;
}

export async function receiveMessageSQS(receiveParams?: ReceiveSQSQueueInput) {
  try {
    logger.log('Receiving Message SQS');

    const message = await SQS.receiveMessage(receiveParams || defaultReceiveMessageParams).promise();
    logger.log(message);

    if (message?.Messages?.length > 0) {
      logger.log('Deleting Message SQS');
      const deleteParams = {
        QueueUrl: WORKFLOW_QUEUE_URL,
        ReceiptHandle: message.Messages[0].ReceiptHandle,
      };
      const deleteMessage = await SQS.deleteMessage(deleteParams).promise();
      logger.log(deleteMessage);
    }

    return message.Messages;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}
