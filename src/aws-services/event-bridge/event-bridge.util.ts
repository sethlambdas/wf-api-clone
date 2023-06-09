import { Logger } from '@nestjs/common';

import { IDetail } from '../../utils/workflow-types/details.types';
import Workflow from '../../workflow';
import { EB } from './event-bridge-config.util';

const logger = new Logger('EventBridge');

export async function deleteEventRule(name: string) {
  try {
    logger.log('Deleting Event Rule');
    const targets = await EB.listTargetsByRule({ Rule: name }).promise();
    logger.log('Target-list:', targets);
    const targetIds = [];
    for (let i = 0; i < targets.Targets.length; i++) {
      targetIds.push(targets.Targets[i].Id);
    }
    const removedTargets = await EB.removeTargets({ Ids: targetIds, Rule: name }).promise();
    logger.log('Removed-targets:', removedTargets);
    const isDeleted = await EB.deleteRule({ Name: name }).promise();
    logger.log('Is Removed:',isDeleted);

    return;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

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

export async function disableRule(params: { Name: string }) {
  try {
    logger.log('Disabling Rule on EventBridge');

    await EB.disableRule(params).promise();

    return true;
  } catch (err) {
    logger.error(`Error, ${err}`);
    return false;
  }
}

export async function enableRule(params: { Name: string }) {
  try {
    logger.log('Enabling Rule on EventBridge');

    await EB.enableRule(params).promise();

    return true;
  } catch (err) {
    logger.error(`Error, ${err}`);
    return false;
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
