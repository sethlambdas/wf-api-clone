import { GenericContainer, Network, StartedNetwork, StartedTestContainer } from "testcontainers";
import { ClientToken } from "../../src/graphql/client-token/client-token.entity";
import { CreateClientTokenInput } from "../../src/graphql/client-token/inputs/create-client-token.inputs";
import { HttpMethod, IGraphqlPayload, networkClient } from "../../src/utils/helpers/networkRequest.util";
import { CreateIntegrationAppInput } from '../../src/graphql/integration-app/inputs/create-integration-app.inputs';
import { AuthType } from "../../src/graphql/common/enums/authentication.enum";
import { FileUploadType } from "../../src/graphql/integration-app/integration-app.enum";
import { ClientAuthMethodEnums, GrantTypeEnums } from '../../src/graphql/common/enums/oauth.enum';
import { IntegrationApp } from "../../src/graphql/integration-app/integration-app.entity";

describe('Integration App Resolver', () => {

    const gql = {
        createIntegrationMutation: `
            mutation CreateIntegrationApp($inputs: CreateIntegrationAppInput!) {
                CreateIntegrationApp(createIntegrationAppInput: $inputs) {
                    PK
                    SK
                    name
                    type
                    fileUploadType
                    headers {
                        fieldValue
                        fieldName
                    }
                    additionalConfiguration {
                        fieldValue
                        fieldName
                    }
                }
            }
        `,
        findIntegrationAppByPK: `
            query FindIntegrationAppByName($inputs: FindIntegrationAppByNameInput!) {
                FindIntegrationAppByName(findIntegrationAppByNameInput: $inputs) {
                    PK
                    SK
                    name
                    type
                    fileUploadType
                    headers {
                        fieldValue
                        fieldName
                    }
                    apiKeyConfiguration {
                        fieldValue
                        fieldName
                    }
                    additionalConfiguration {
                        fieldValue
                        fieldName
                    }
                    addTo
                }
            }
        `
    }


    jasmine.DEFAULT_TIMEOUT_INTERVAL = 2 * 60 * 1000;

    let localstackContainer: StartedTestContainer;
    let workflowApiContainer: StartedTestContainer;
    let network: StartedNetwork;

    beforeAll(async () => {
        network = await new Network().start();

        localstackContainer = await new GenericContainer('localstack/localstack:stable')
            .withName('test_localstack')
            .withExposedPorts({ container: 4566, host: 4566 })
            .withEnvironment({
                AWS_DEFAULT_REGION: "ap-southeast-2",
                SERVICES: "s3,lambda,sqs,stepfunctions,events,iam,cloudformation,sts,dynamodb,apigateway,kms,logs",
                LS_LOG: "trace",
                LAMBDA_EXECUTOR: "docker",
                DOCKER_HOST: "unix:///var/run/docker.sock",
                HOSTNAME_EXTERNAL: "localstack",
                TMPDIR: "/storage",
                DEBUG: "1",
            })
            .withBindMounts([
                { source: '/var/lib/localstack', target: '/var/lib/localstack' },
                { source: '/var/run/docker.sock', target: '/var/run/docker.sock' }
            ])
            .withNetworkMode(network.getName())
            .start();

        const kmsResult = await localstackContainer.exec(
            ['/bin/bash', '-c', 'awslocal kms create-key --region ap-southeast-2'],
        );
        console.log('[kmsResult]', kmsResult)

        console.log('[kmsResult]', JSON.parse(kmsResult.output).KeyMetadata.KeyId)

        workflowApiContainer = await new GenericContainer('node:18-alpine')
            .withName("workflow_api")
            .withExposedPorts({ container: 3001, host: 3001 })
            .withEnvironment({
                AWS_SECRET_ACCESS_KEY: 'sampleSecretAccessKey',
                AWS_ACCESS_KEY_ID: 'sampleAccessKeyId',
                AWS_REGION: 'ap-southeast-2',
                WORKFLOW_QUEUE: 'WORKFLOW_QUEUE',
                WORKFLOW_QUEUE_ERROR: 'WORKFLOW_QUEUE_ERROR',
                AWS_KMS_KEY_ID: JSON.parse(kmsResult.output).KeyMetadata.KeyId
            })
            .withBindMounts([
                {
                    source: '/home/sj/workflow-api/node_modules',
                    target: '/node_modules'
                },
                {
                    source: '/home/sj/workflow-api/tsconfig.json',
                    target: '/tsconfig.json'
                },
                {
                    source: '/home/sj/workflow-api/package.json',
                    target: '/package.json'
                },
                {
                    source: '/home/sj/workflow-api/nodemon.json',
                    target: '/nodemon.json'
                },
                {
                    source: '/home/sj/workflow-api/config',
                    target: '/config'
                },
                {
                    source: '/home/sj/workflow-api/src',
                    target: '/src'
                },
                {
                    source: '/home/sj/workflow-api',
                    target: '/workflow-api'
                },
            ])
            .withCommand(["/bin/sh", "-c", "npm install -g pnpm && pnpm run watch"])
            .withNetworkMode(network.getName())
            .start();

        const apiLogs = await workflowApiContainer.logs();
        apiLogs.on('data', line => console.log(line));
        apiLogs.on('err', line => console.error(line));
    });

    it('should create the integration', async () => {
        const createIntegrationAppInput: CreateIntegrationAppInput = {
            name: 'Bitly',
            type: AuthType.OAUTH,
            fileUploadType: "DIRECT_BODY" as FileUploadType,
            authMethod: ClientAuthMethodEnums.client_secret_post,
            version: 1,
            grantType: GrantTypeEnums.AUTHORIZATION_CODE,
            urls: {
                authorize: 'https://bitly.com/oauth/authorize',
                token: 'https://api-ssl.bitly.com/oauth/access_token',
            },
            scopes: ['read', 'write', 'private', 'org'],
            headers: [
                {
                    fieldName: 'Content-Type',
                    fieldValue: 'application/json',
                },
                {
                    fieldName: 'Authorization',
                    fieldValue: 'Bearer {{secret}}',
                },
            ],
        };

        const createIntegrationPayload: IGraphqlPayload = {
            query: gql.createIntegrationMutation,
            variables: { inputs: createIntegrationAppInput },
        };

        const endpoint = 'http://localhost:3001/api/graphql';
        const createIntegrationResponse = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: createIntegrationPayload,
        })) as any;

        const integration: IntegrationApp = createIntegrationResponse.data.CreateIntegrationApp;
     
        expect(integration).not.toBeNull();
        expect(integration.name).toBe(createIntegrationAppInput.name)
    });

    it('should read the integration', async () => {

        const findIntegrationAppByNameInput = {
            name: "Bitly"
        }

        const findIntegrationPayload: IGraphqlPayload = {
            query: gql.findIntegrationAppByPK,
            variables: { inputs: findIntegrationAppByNameInput },
        };
        const endpoint = 'http://localhost:3001/api/graphql';

        const findIntegrationResponse = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: findIntegrationPayload,
        })) as any;
        const findClientToken: IntegrationApp = findIntegrationResponse.data.FindIntegrationAppByName;
    
        expect(findClientToken).not.toBeNull();
        expect(findClientToken.name).toBe(findIntegrationAppByNameInput.name);
    });

    afterAll(async () => {
        await workflowApiContainer.stop();
        await localstackContainer.stop();
        await network.stop();
    });
});
