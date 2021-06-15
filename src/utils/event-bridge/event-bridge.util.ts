import { Logger } from '@nestjs/common';

import Workflow from '../../workflow';
import { IDetail } from '../workflow-types/details.types';
import { EB } from './event-bridge-config.util';

const logger = new Logger('EventBridge');

// tslint:disable-next-line: class-name
interface PutEventsInput {
  Entries: {
    Detail: string;
    DetailType: string;
    Resources?: string[];
    Source: string;
  }[];
}

export async function putEventsEB(putEventsParams: PutEventsInput) {
  try {
    logger.log('Putting Events on EventBridge');

    const events = await EB.putEvents(putEventsParams).promise();
    logger.log(events);

    return events;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

interface PutRuleInput {
  Name: string;
  EventPattern?: string;
  RoleArn?: string;
  ScheduleExpression?: string;
  State?: string;
}

export async function putRuleEB(putRuleParams: PutRuleInput) {
  try {
    logger.log('Putting Rule on EventBridge');

    const rule = await EB.putRule(putRuleParams).promise();
    logger.log(rule);

    return rule;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

interface PutTargetsInput {
  Rule: string;
  Targets: { Arn: string; Id: string }[];
}

export async function putTargetsEB(putTargetsParams: PutTargetsInput) {
  try {
    logger.log('Putting Targets on EventBridge');

    const target = await EB.putTargets(putTargetsParams).promise();
    logger.log(target);

    return target;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

export function formCreateEventParams(detail: IDetail) {
  const Entries = [
    {
      Detail: JSON.stringify(detail),
      DetailType: Workflow.getDetailType(),
      Source: Workflow.getSource(),
    },
  ];

  const params = { Entries };

  return params;
}
