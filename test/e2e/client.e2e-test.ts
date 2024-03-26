import { GenericContainer, Network, StartedNetwork, StartedTestContainer } from "testcontainers";
import { AuthType, ClientStatus } from "../../src/graphql/common/enums/authentication.enum";
import { ClientAuthMethodEnums, GrantTypeEnums } from '../../src/graphql/common/enums/oauth.enum';
import { CreateClientInput } from '../../src/graphql/client/inputs/create-client.input';
import { FindClientByPkInput } from '../../src/graphql/client/inputs/find-client.input';
import { IntegrationApp } from "../../src/graphql/integration-app/integration-app.entity";
import { FileUploadType } from "../../src/graphql/integration-app/integration-app.enum";
import { HttpMethod, IGraphqlPayload, networkClient } from "../../src/utils/helpers/networkRequest.util";
import { CreateOrganizationInput } from "../../src/graphql/organizations/inputs/create-organization.input";
import { Client } from "../../src/graphql/client/client.entity";

describe('Client Resolver', () => {

    const gql = {
        createOrganization: `
            mutation CreateOrganization($createOrganizationInput: CreateOrganizationInput!) {
                CreateOrganization(createOrganizationInput: $createOrganizationInput) {
                    PK
                    ORGNAME
                }
            }
      `,
        createClient: `
            mutation CreateClient($createClientInput: CreateClientInput!) {
                CreateClient(createClientInput: $createClientInput) {
                    PK
                    SK
                    name
                    type
                    status
                    intAppId
                    scopes
                    fileUploadType
                    headers {
                        fieldName
                        fieldValue
                    }
                    apiKeyConfigurations {
                        fieldName
                        fieldValue
                    }
                    secrets {
                        apiKey
                        username
                        password
                        clientId
                        clientSecret
                    }
                    metadata {
                        shopifyStore
                    }
                }
            }
        `,
        findClientByPK: `
            query FindClientByPK($inputs: FindClientByPkInput!) {
                FindClientByPK(findClientByPkInput: $inputs) {
                    PK
                    SK
                    name
                    type
                    status
                    intAppId
                    scopes
                    fileUploadType
                    headers {
                        fieldName
                        fieldValue
                    }
                    apiKeyConfigurations {
                        fieldName
                        fieldValue
                    }
                    secrets {
                        hostId
                        organisation
                        apiKey
                        username
                        password
                        clientId
                        clientSecret
                        rootUrl
                        accessKey
                        secretKey
                    }
                    metadata {
                        shopifyStore
                    }
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

    const findClientByPKInput: FindClientByPkInput = {
        PK: "PK",
        SK: "SK"
    }

    it('should create the client', async () => {
        const endpoint = 'http://localhost:3001/api/graphql';

        const createOrganizationInput: CreateOrganizationInput = {
            ORGNAME: "TEST_ORGANIZATION",
        };

        const createOrganizationPayload: IGraphqlPayload = {
            query: gql.createOrganization,
            variables: { createOrganizationInput: createOrganizationInput },
        };

        const organization = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: createOrganizationPayload,
        })) as any;

        expect(organization.data.CreateOrganization.ORGNAME).toBe(createOrganizationInput.ORGNAME)

        const createClientInput: CreateClientInput = {
            appClient: "test-app-client",
            orgId: organization.data.CreateOrganization.PK,
            name: "CLIENT-NAME",
            type: AuthType.API_KEY,
            status: ClientStatus.ACTIVE,
            intAppId: "INTEGRATION-PK",
            integrationType: "INTEGRATION-NAME",
            secrets: {
                accessKey: "accesskey",
                apiKey: "apikey",
                clientId: "clientId",
                clientSecret: "clientSecret"
            },
            headers: [
                { fieldName: "Authorization", fieldValue: "Bearer {{secret}}" }
            ],
            fileUploadType: "DIRECT_BODY" as FileUploadType,
        };

        const createClientPayload: IGraphqlPayload = {
            query: gql.createClient,
            variables: { createClientInput: createClientInput },
        };


        const createClientResponse = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: createClientPayload,
        })) as any;

        const client: Client = createClientResponse.data.CreateClient;

        findClientByPKInput.PK = client.PK;
        findClientByPKInput.SK = client.SK;

        expect(client).not.toBeNull();
        expect(client.name).toBe(createClientInput.name)
    });

    it('should read the client by PK', async () => {

        const findIntegrationPayload: IGraphqlPayload = {
            query: gql.findClientByPK,
            variables: { inputs: findClientByPKInput },
        };

        const endpoint = 'http://localhost:3001/api/graphql';

        const findClientByPKResponse = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: findIntegrationPayload,
        })) as any;
        const findClientByPK: Client = findClientByPKResponse.data.FindClientByPK;

        expect(findClientByPK).not.toBeNull();
        expect(findClientByPK.PK).toBe(findClientByPKInput.PK);
    });

    afterAll(async () => {
        await workflowApiContainer.stop();
        await localstackContainer.stop();
        await network.stop();
    });
});
