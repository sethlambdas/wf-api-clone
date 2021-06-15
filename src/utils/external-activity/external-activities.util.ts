import { CAT } from '../../graphql/workflow-executions/workflow-execution.entity';
import Workflow from '../../workflow';
import { putEventsEB } from '../event-bridge/event-bridge.util';

export enum ExternalActivityTypes {
  EmailIngestion = 'Email Ingestion',
}

export const runExternalService = async (act: CAT, activeWorkflowDetails: any) => {
  const detail = JSON.stringify({
    incomingData: { ...act.MD },
    activeWorkflowDetails,
  });

  const serviceType = act.T.replace(' ', '-');
  const serviceAction = act.MD.ExternalServiceAction;

  const params = {
    Entries: [
      {
        Detail: detail,
        DetailType: `service::${serviceType}::${serviceAction}`,
        Source: Workflow.getSource(),
      },
    ],
  };

  await putEventsEB(params);
};
