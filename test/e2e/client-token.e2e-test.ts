import { GenericContainer, Network, StartedNetwork, StartedTestContainer } from "testcontainers";
import { ClientToken } from "../../src/graphql/client-token/client-token.entity";
import { CreateClientTokenInput } from "../../src/graphql/client-token/inputs/create-client-token.inputs";
import { HttpMethod, IGraphqlPayload, networkClient } from "../../src/utils/helpers/networkRequest.util";

describe('Client Token Resolver', () => {

    const gql = {
        createClientTokenMutation: `
            mutation CreateClientToken($createClientTokenInput: CreateClientTokenInput!) {
                CreateClientToken(createClientTokenInput: $createClientTokenInput) {
                    PK
                    accessToken
                    refreshToken
                    expTime
                    clientPK
                }
            }
        `,
        findClientTokenQuery: `
            query FindClientTokenByPK($findClientTokenByPkInput: FindClientTokenByPkInput!) {
                FindClientTokenByPK(findClientTokenByPkInput: $findClientTokenByPkInput) {
                    PK
                    accessToken
                    refreshToken
                    expTime
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

    it('should create the client token', async () => {
        const createClientTokenInput: CreateClientTokenInput = {
            PK: "RANDOM-PK",
            accessToken: "ACCESS_TOKEN",
            refreshToken: "REFRESH TOKEN",
            expTime: 86000,
            clientPK: "CLIENT PK",
        };

        const createClientTokenPayload: IGraphqlPayload = {
            query: gql.createClientTokenMutation,
            variables: { createClientTokenInput: createClientTokenInput },
        };

        const endpoint = 'http://localhost:3001/api/graphql';
        const createClientTokenResponse = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: createClientTokenPayload,
        })) as any;

        const createClientToken: ClientToken = createClientTokenResponse.data.CreateClientToken;

        expect(createClientToken).not.toBeNull();
        expect(createClientToken.PK).toBe(createClientTokenInput.PK)
        expect(createClientToken.clientPK).toBe(createClientTokenInput.clientPK)
    });

    it('should read the client token', async () => {
        const createClientTokenInput: CreateClientTokenInput = {
            PK: "RANDOM-PK",
            accessToken: "ACCESS_TOKEN",
            refreshToken: "REFRESH TOKEN",
            expTime: 86000,
            clientPK: "CLIENT PK",
        };

        const findClientTokenInput = {
            PK: "RANDOM-PK"
        }

        const findClientTokenPayload: IGraphqlPayload = {
            query: gql.findClientTokenQuery,
            variables: { findClientTokenByPkInput: findClientTokenInput },
        };
        const endpoint = 'http://localhost:3001/api/graphql';

        const findClientTokenResponse = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: findClientTokenPayload,
        })) as any;

        const findClientToken: ClientToken = findClientTokenResponse.data.FindClientTokenByPK;

        expect(findClientToken).not.toBeNull();
        expect(findClientToken.accessToken).toBe(createClientTokenInput.accessToken);
        expect(findClientToken.refreshToken).toBe(createClientTokenInput.refreshToken);
        expect(findClientToken.expTime).toBe(createClientTokenInput.expTime);
    });

    afterAll(async () => {
        await workflowApiContainer.stop();
        await localstackContainer.stop();
        await network.stop();
    });
});
