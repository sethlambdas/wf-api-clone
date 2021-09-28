import { ConfigUtil } from '@lambdascrew/utility';

import {
  createDeploymentAPIGateway,
  createResourceAPIGateway,
  createRestApiAPIGateway,
  getResourcesAPIGateway,
  getRestApisAPIGateway,
  putIntegrationAPIGateway,
  putMethodAPIGateway,
  putMethodResponseAPIGateway,
} from '../../aws-services/api-gateway/api-gateway.util';
import { deleteEventRule, putRuleEB, putTargetsEB } from '../../aws-services/event-bridge/event-bridge.util';
import {
  QUEUE_ERROR,
  QUEUE_NAME,
  WORKFLOW_QUEUE_URL,
  WORKFLOW_QUEUE_URL_ERROR,
} from '../../aws-services/sqs/sqs-config.util';
import { createSQSQueue, deleteQueue, getQueueURL, getSQSQueueAttributes } from '../../aws-services/sqs/sqs.util';
import Workflow from '../../workflow';

export default async function localStackInit() {
  const queue = await getQueueURL(QUEUE_NAME);

  if (queue) {
    await deleteEventRule(Workflow.getRule());
    await deleteQueue(WORKFLOW_QUEUE_URL_ERROR);
    await deleteQueue(WORKFLOW_QUEUE_URL);
  }

  const putRuleParams = {
    Name: Workflow.getRule(),
    EventPattern: JSON.stringify({
      'detail-type': [Workflow.getDetailType()],
      source: [Workflow.getSource()],
    }),
  };
  await putRuleEB(putRuleParams);

  const queueParamsError = {
    QueueName: QUEUE_ERROR,
  };

  await createSQSQueue(queueParamsError);

  const {
    Attributes: { QueueArn: queueArnError },
  } = await getSQSQueueAttributes(WORKFLOW_QUEUE_URL_ERROR);

  await createSQSQueue(null, queueArnError);

  const {
    Attributes: { QueueArn: queueArn },
  } = await getSQSQueueAttributes(WORKFLOW_QUEUE_URL);

  const putTargetsParams = {
    Rule: Workflow.getRule(),
    Targets: [{ Arn: queueArn, Id: '1' }],
  };
  await putTargetsEB(putTargetsParams);

  await localStackApiGateway();
}

export async function localStackApiGateway() {
  const restApis = await getRestApisAPIGateway({
    limit: null,
  });

  const workflowRestApi = restApis.items.find((getRestApi) => {
    return getRestApi.name === ConfigUtil.get('apiGateway.restApiName');
  });

  if (workflowRestApi) {
    return;
  }

  const restApi = await createRestApiAPIGateway({
    name: ConfigUtil.get('apiGateway.restApiName'),
    endpointConfiguration: { types: ['EDGE'] },
  });

  const restResources = await getResourcesAPIGateway({
    restApiId: restApi.id,
  });

  const restResource = restResources.items[0];

  const createResource = await createResourceAPIGateway({
    restApiId: restApi.id,
    parentId: restResource.id,
    pathPart: ConfigUtil.get('apiGateway.restApiResource'),
  });

  const createResourceId = await createResourceAPIGateway({
    restApiId: restApi.id,
    parentId: createResource.id,
    pathPart: '{aid}',
  });

  const putMethodPOST = await putMethodAPIGateway({
    restApiId: restApi.id,
    resourceId: createResourceId.id,
    httpMethod: 'POST',
    authorizationType: 'NONE',
    apiKeyRequired: false,
    requestParameters: {
      'method.request.body': true,
      'method.request.path.aid': true,
    },
  });

  await putMethodResponseAPIGateway({
    restApiId: restApi.id,
    resourceId: createResourceId.id,
    httpMethod: 'POST',
    statusCode: '200',
  });

  const putIntegration = await putIntegrationAPIGateway({
    restApiId: restApi.id,
    resourceId: createResourceId.id,
    httpMethod: 'POST',
    type: 'HTTP',
    integrationHttpMethod: 'POST',
    uri: `http://host.docker.internal:3000/api/workflows/trigger/{aid}`,
    requestParameters: {
      'integration.request.body': 'method.request.body',
      'integration.request.path.aid': 'method.request.path.aid',
    },
  });

  const createDeployment = await createDeploymentAPIGateway({
    restApiId: restApi.id,
    stageName: process.env.NODE_ENV,
    stageDescription: ConfigUtil.get('apiGateway.description'),
    description: ConfigUtil.get('apiGateway.description'),
  });
}
