import { Logger } from '@nestjs/common';
import { APIGateway } from './api-gateway-config.util';

const logger = new Logger('APIGateway');

interface GetRestApisInput {
  limit: number;
}

export async function getRestApisAPIGateway(getRestApisParams: GetRestApisInput) {
  try {
    logger.log('Get Rest Apis on API Gateway');

    const result = await APIGateway.getRestApis(getRestApisParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

interface CreateRestApiInput {
  name: string;
  endpointConfiguration?: { types: string[] };
}

export async function createRestApiAPIGateway(createRestApiParams: CreateRestApiInput) {
  try {
    logger.log('Create Rest Api on API Gateway');

    const result = await APIGateway.createRestApi(createRestApiParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

interface GetResourcesInput {
  restApiId: string;
}

export async function getResourcesAPIGateway(getResourcesParams: GetResourcesInput) {
  try {
    logger.log('Get Resources on API Gateway');

    const result = await APIGateway.getResources(getResourcesParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

interface CreateResourceInput {
  restApiId: string;
  parentId: string;
  pathPart: string;
}

export async function createResourceAPIGateway(createResourceParams: CreateResourceInput) {
  try {
    logger.log('Create Resource on API Gateway');

    const result = await APIGateway.createResource(createResourceParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

interface PutMethodInput {
  restApiId: string;
  resourceId: string;
  httpMethod: string;
  authorizationType: string;
  apiKeyRequired: boolean;
  requestParameters?: { [key: string]: any };
}

export async function putMethodAPIGateway(putMethodParams: PutMethodInput) {
  try {
    logger.log('Put Method on API Gateway');

    const result = await APIGateway.putMethod(putMethodParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

interface PutIntegrationInput {
  restApiId: string;
  resourceId: string;
  httpMethod: string;
  type: string;
  integrationHttpMethod: string;
  uri: string;
  requestParameters?: any;
}

export async function putIntegrationAPIGateway(putIntegrationParams: PutIntegrationInput) {
  try {
    logger.log('Put Integration on API Gateway');

    const result = await APIGateway.putIntegration(putIntegrationParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

interface PutMethodResponseInput {
  httpMethod: string;
  resourceId: string;
  restApiId: string;
  statusCode: string;
}

export async function putMethodResponseAPIGateway(putMethodResponseParams: PutMethodResponseInput) {
  try {
    logger.log('Put Method Response on API Gateway');

    const result = await APIGateway.putMethodResponse(putMethodResponseParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

interface CreateDeploymentInput {
  restApiId: string;
  stageName: string;
  stageDescription: string;
  description: string;
}

export async function createDeploymentAPIGateway(createDeploymentParams: CreateDeploymentInput) {
  try {
    logger.log('Create Deployment on API Gateway');

    const result = await APIGateway.createDeployment(createDeploymentParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

interface CreateUsagePlanInput {
  name: string;
  apiStages: [
    {
      apiId: string;
      stage: string;
    },
  ];
  quota?: {
    limit?: number;
    offset?: number;
    period?: string;
  };
  throttle?: {
    burstLimit?: number;
    rateLimit?: number;
  };
}

export async function createUsagePlanAPIGateway(createUsagePlanParams: CreateUsagePlanInput) {
  try {
    logger.log('Create Usage Plan on API Gateway');

    const result = await APIGateway.createUsagePlan(createUsagePlanParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

interface updateUsagePlanProps {
  usagePlanId: string;
  patchOperations: any;
}

export async function updateUsagePlanAPIGateway(updateUsagePlansParams: updateUsagePlanProps) {
  try {
    logger.log('Update Usage Plan on API Gateway');

    const result = await APIGateway.updateUsagePlan(updateUsagePlansParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

interface CreateApiKeyInput {
  name: string;
  enabled: boolean;
  generateDistinctId: boolean;
}

export async function createApiKeyAPIGateway(createApiKeyParams: CreateApiKeyInput) {
  try {
    logger.log('Create Api Key on API Gateway');

    const result = await APIGateway.createApiKey(createApiKeyParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

export async function updateApiGatewayApiKey(apiKey: string, patchOperations: any) {
  try {
    logger.log('Update Api Key on API Gateway');

    const result = await APIGateway.updateApiKey({
      apiKey,
      patchOperations,
    }).promise();
    logger.log('update-api-key', result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

interface GetApiKeyProps {
  apiKey: string;
  includeValue?: boolean;
}

export async function getApiGatewayApiKey({ apiKey, includeValue = false }: GetApiKeyProps) {
  try {
    logger.log('get Api Key on API Gateway');

    const result = await APIGateway.getApiKey({ apiKey, includeValue }).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

export async function getApiGatewayApiKeys(customerId: string) {
  try {
    logger.log('Get Api Keys on API Gateway');

    const result = await APIGateway.getApiKeys({ customerId }).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error:`, err);
  }
}

interface CreateUsagePlanKeyInput {
  keyId: string;
  keyType: string;
  usagePlanId: string;
}

export async function createUsagePlanKeyAPIGateway(createUsagePlanKeyParams: CreateUsagePlanKeyInput) {
  try {
    logger.log('Create Usage Plan Key on API Gateway');

    const result = await APIGateway.createUsagePlanKey(createUsagePlanKeyParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}

interface GetUsagePlansInput {
  keyId?: string;
  limit?: number;
}

export async function getUsagePlansAPIGateway(getUsagePlansParams: GetUsagePlansInput) {
  try {
    logger.log('Get Usage Plans on API Gateway');

    const result = await APIGateway.getUsagePlans(getUsagePlansParams).promise();
    logger.log(result);

    return result;
  } catch (err) {
    logger.error(`Error, ${err}`);
  }
}
