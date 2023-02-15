import assignData from './assign-data.util';
import condition from './condition.util';
import delay from './delay.util';
import email from './email.util';
import manualApproval from './manual-approval.util';
import mergeData from './merge-data.util';
import webService from './web-service.util';
import matchingData from './matching-data.util';
import dbQueryBuilder from './database-builder.util';
interface ActivityRegistryItem {
  label: string;
  processActivity: (payload?: any, state?: any) => Promise<unknown>;
}

interface ActivityRegistry {
  [key: string]: ActivityRegistryItem;
}

export enum TriggerTypes {
  HTTP = 'HTTP',
  Timed = 'Timed',
}

export enum ActivityTypes {
  WebService = 'Web Service',
  MatchingData = 'Matching Data',
  QueryBuilder = 'Visual DB Query',
  AdvanceQueryBuilder = 'SQL | Doc Query',
  Delay = 'Delay',
  Email = 'Email',
  Condition = 'Condition',
  AssignData = 'Assign Data',
  MergeData = 'Merge Data',
  ManualApproval = 'Manual Approval',
  SubWorkflow = 'SubWorkflow',
  ParallelStart = 'Parallel Start',
  ParallelEnd = 'Parallel End',
  StartLoop = 'Start Loop',
  EndLoop = 'End Loop',
  End = 'End',
}

const activityRegistry: ActivityRegistry = {
  [ActivityTypes.MatchingData]: {
    label: ActivityTypes.MatchingData,
    processActivity: (payload?: any, state?: any) => matchingData(payload, state),
  },
  [ActivityTypes.QueryBuilder]: {
    label: ActivityTypes.QueryBuilder,
    processActivity: (payload?: any, state?: any) => dbQueryBuilder(payload, state),
  },
  [ActivityTypes.AdvanceQueryBuilder]: {
    label: ActivityTypes.AdvanceQueryBuilder,
    processActivity: (payload?: any, state?: any) => dbQueryBuilder(payload, state),
  },
  [ActivityTypes.ParallelStart]: {
    label: ActivityTypes.ParallelStart,
    processActivity: () => null,
  },
  [ActivityTypes.ParallelEnd]: {
    label: ActivityTypes.ParallelEnd,
    processActivity: () => null,
  },
  [ActivityTypes.ManualApproval]: {
    label: ActivityTypes.ManualApproval,
    processActivity: (payload?: any, state?: any) => manualApproval(payload),
  },
  [ActivityTypes.WebService]: {
    label: ActivityTypes.WebService,
    processActivity: (payload?: any, state?: any) => webService(payload, state),
  },
  [ActivityTypes.Delay]: {
    label: ActivityTypes.Delay,
    processActivity: (payload?: any, state?: any) => delay(payload),
  },
  [ActivityTypes.Email]: {
    label: ActivityTypes.Email,
    processActivity: (payload?: any, state?: any) => email(payload, state),
  },
  [ActivityTypes.Condition]: {
    label: ActivityTypes.Condition,
    processActivity: (payload?: any, state?: any) => condition(payload, state),
  },
  [ActivityTypes.AssignData]: {
    label: ActivityTypes.AssignData,
    processActivity: (payload?: any, state?: any) => assignData(payload),
  },
  [ActivityTypes.MergeData]: {
    label: ActivityTypes.MergeData,
    processActivity: (payload?: any, state?: any) => mergeData(payload, state),
  },
};

export default activityRegistry;
