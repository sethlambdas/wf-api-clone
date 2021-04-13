import assignData from './assign-data.util';
import conditional from './conditional.util';
import delay from './delay.util';
import email from './email.util';
import manualInput from './manual-input.util';
import webService from './web-service.util';

interface ActivityRegistryItem {
  label: string;
  processActivity: (payload?: any) => Promise<unknown>;
}

interface ActivityRegistry {
  [key: string]: ActivityRegistryItem;
}

export enum ActivityTypes {
  WebService = 'WebService',
  Delay = 'Delay',
  Email = 'Email',
  Conditional = 'Conditional',
  AssignData = 'AssignData',
  ManualInput = 'ManualInput',
}

const activityRegistry = {
  ManualInput: {
    label: 'Manual Input',
    processActivity: (payload?: any) => manualInput(payload),
  },
  WebService: {
    label: 'Web Service',
    processActivity: (payload?: any) => webService(payload),
  },
  Delay: {
    label: 'Delay',
    processActivity: (payload?: any) => delay(payload),
  },
  Email: {
    label: 'Email',
    processActivity: (payload?: any) => email(payload),
  },
  Conditional: {
    label: 'Conditional',
    processActivity: (payload?: any) => conditional(payload),
  },
  AssignData: {
    label: 'AssignData',
    processActivity: (payload?: any) => assignData(payload),
  },
} as ActivityRegistry;

export default activityRegistry;
