import assignData from './assign-data.util';
import conditional from './conditional.util';
import delay from './delay.util';
import email from './email.util';
import manualInput from './manual-input.util';
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
  Conditional = 'Conditional',
  AssignData = 'Assign Data',
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
  Conditional: {
    label: 'Conditional',
    processActivity: (payload?: any, state?: any) => conditional(payload),
  },
  'Assign Data': {
    label: 'Assign Data',
    processActivity: (payload?: any, state?: any) => assignData(payload),
  },
} as ActivityRegistry;

export default activityRegistry;
