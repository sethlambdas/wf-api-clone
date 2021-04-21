import assignData from './assign-data.util';
import condition from './condition.util';
import delay from './delay.util';
import email from './email.util';
import manualInput from './manual-input.util';
import mergeData from './merge-data.util';
import webService from './web-service.util';

interface ActivityRegistryItem {
  label: string;
  processActivity: (payload?: any, state?: any) => Promise<unknown>;
}

interface ActivityRegistry {
  [key: string]: ActivityRegistryItem;
}

export enum ActivityTypes {
  WebService = 'Web Service',
  Delay = 'Delay',
  Email = 'Email',
  Condition = 'Condition',
  AssignData = 'Assign Data',
  MergeData = 'Merge Data',
  ManualInput = 'Manual Input',
  ParallelStart = 'Parallel Start',
  ParallelEnd = 'Parallel End',
}

const activityRegistry = {
  'Parallel Start': {
    label: 'Parallel Start',
    processActivity: () => null,
  },
  'Parallel End': {
    label: 'Parallel End',
    processActivity: () => null,
  },
  'Manual Input': {
    label: 'Manual Input',
    processActivity: (payload?: any, state?: any) => manualInput(payload),
  },
  'Web Service': {
    label: 'Web Service',
    processActivity: (payload?: any, state?: any) => webService(payload),
  },
  Delay: {
    label: 'Delay',
    processActivity: (payload?: any, state?: any) => delay(payload),
  },
  Email: {
    label: 'Email',
    processActivity: (payload?: any, state?: any) => email(payload),
  },
  Condition: {
    label: 'Condition',
    processActivity: (payload?: any, state?: any) => condition(payload),
  },
  'Assign Data': {
    label: 'Assign Data',
    processActivity: (payload?: any, state?: any) => assignData(payload),
  },
  'Merge Data': {
    label: 'Merge Data',
    processActivity: (payload?: any, state?: any) => mergeData(payload),
  },
} as ActivityRegistry;

export default activityRegistry;
