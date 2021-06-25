import Workflow from '../workflow';
import {
  createDeploymentAPIGateway,
  createResourceAPIGateway,
  createRestApiAPIGateway,
  getResourcesAPIGateway,
  getRestApisAPIGateway,
  putIntegrationAPIGateway,
  putMethodAPIGateway,
  putMethodResponseAPIGateway,
} from './api-gateway/api-gateway.util';
import { ConfigUtil } from './config.util';
import { putRuleEB, putTargetsEB } from './event-bridge/event-bridge.util';
import { QUEUE_ERROR, WORKFLOW_QUEUE_URL, WORKFLOW_QUEUE_URL_ERROR } from './sqs/sqs-config.util';
import { createSQSQueue, getSQSQueueAttributes } from './sqs/sqs.util';

export default async function localStackInit() {
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
    endpointConfiguration: { types: ['EDGE'] }
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
    apiKeyRequired: true,
    requestParameters: {
      'method.request.path.aid': true,
    },
  });

  await putMethodResponseAPIGateway({
    restApiId: restApi.id,
    resourceId: createResourceId.id,
    httpMethod: 'POST',
    statusCode: '200'
  })

  const putIntegration = await putIntegrationAPIGateway({
    restApiId: restApi.id,
    resourceId: createResourceId.id,
    httpMethod: 'POST',
    type: 'HTTP',
    integrationHttpMethod: 'POST',
    uri: `http://host.docker.internal:3000/api/workflows/trigger/{id}`,
    requestParameters: {
      'integration.request.path.id': 'method.request.path.aid',
    },
  });

  const createDeployment = await createDeploymentAPIGateway({
    restApiId: restApi.id,
    stageName: process.env.NODE_ENV,
    stageDescription: ConfigUtil.get('apiGateway.description'),
    description: ConfigUtil.get('apiGateway.description'),
  });
}
