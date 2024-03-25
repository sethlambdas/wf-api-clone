import { GenericContainer, Network, StartedNetwork, StartedTestContainer } from "testcontainers";
import { ClientToken } from "../../src/graphql/client-token/client-token.entity";
import { CreateClientTokenInput } from "../../src/graphql/client-token/inputs/create-client-token.inputs";
import {
    CreateWorkflowInput, InitiateAWorkflowStepInput
} from "../../src/graphql/workflow/inputs/post.inputs"
import { GetWorkflowByNameInput, GetWorkflowsOfAnOrgInput } from '../../src/graphql/workflow/inputs/get.inputs';
import { SaveWorkflowInput } from '../../src/graphql/workflow/inputs/put.inputs';
import { CreateWorkflowStepInput } from '../../src/graphql/workflow-steps/inputs/post.inputs';
import { HttpMethod, IGraphqlPayload, networkClient } from "../../src/utils/helpers/networkRequest.util";
import { CreateWorkflowResponse, Status } from "../../src/graphql/workflow/workflow.entity";
import { CompositePrimaryKeyInput } from "../../src/graphql/common/inputs/workflow-key.input";
import { CreateOrganizationInput } from "../../src/graphql/organizations/inputs/create-organization.input";

describe('Workflow Resolver', () => {

    const workflowKeysToDelete: any = [];
    const workflowVersionKeysToDelete: any = [];
    const orgId = 'ORG#1234';

    const gql = {
        createOrganization: `
          mutation CreateOrganization($createOrganizationInput: CreateOrganizationInput!) {
            CreateOrganization(createOrganizationInput: $createOrganizationInput) {
                PK
                ORGNAME
            }
          }
        `,
        createWorkflowMutation: `
          mutation CreateWorkflow($createWorkflowInput: CreateWorkflowInput!) {
            CreateWorkflow(createWorkflowInput: $createWorkflowInput) {
              WorkflowKeys {
                PK
                SK
              }
              WorkflowVersionKeys {
                PK
                SK
              }
              IsWorkflowNameExist
              Error
            }
          }
        `,
        getWorkflowByName: `
          query GetWorkflowByName($getWorkflowByNameInput: GetWorkflowByNameInput!) {
            GetWorkflowByName(getWorkflowByNameInput: $getWorkflowByNameInput) {
              PK
              SK
              WLFN
              DATA
            }
          }
        `,
        getWorkflowVersionByKey: `
          query GetWorkflowVersionByKey($workflowVersionKeysInput: CompositePrimaryKeyInput!) {
            GetWorkflowVersionByKey(workflowVersionKeysInput: $workflowVersionKeysInput) {
              PK
              SK
              WV
            }
          }
        `,
        getWorkflowByKey: `
          query GetWorkflowByKey($workflowKeysInput: CompositePrimaryKeyInput!) {
            GetWorkflowByKey(workflowKeysInput: $workflowKeysInput) {
              PK
              SK
              WLFN
              DATA
            }
          }
        `,
        getWorkflowStepWithinAVersion: `
        query GetWorkflowStepsWithinAVersion($workflowVersionSK: String!) {
          GetWorkflowStepsWithinAVersion(workflowVersionSK: $workflowVersionSK) {
            PK
            SK
            DATA
            ACT {
                T
            }
          }
        }
      `,
        createWorkflowStep: `
          mutation CreateWorkflowStep($createWorkflowStepInput: CreateWorkflowStepInput!) {
            CreateWorkflowStep(createWorkflowStepInput: $createWorkflowStepInput) {
              PK
              SK
              AID
              NAID
            }
          }
        `,
        getWorkflowsOfAnOrg: `
          query GetWorkflowsOfAnOrg($getWorkflowsOfAnOrgInput: GetWorkflowsOfAnOrgInput!) {
            GetWorkflowsOfAnOrg(getWorkflowsOfAnOrgInput: $getWorkflowsOfAnOrgInput) {
              Workflows {
                PK
                SK
                WLFN
                UQ_OVL
              }
              TotalPages
              Error
            }
          }
        `,
        saveWorkflowMutation: `
          mutation SaveWorkflow($saveWorkflowInput: SaveWorkflowInput!) {
            SaveWorkflow(saveWorkflowInput: $saveWorkflowInput) {
              PK
              SK
              WLFN
              DATA
              FAID
              STATUS
            }
          }
        `,
        initiateAWorkflowStep: `
            mutation InitiateAWorkflowStep ($initiateAWorkflowStepInput: InitiateAWorkflowStepInput!) {
            InitiateAWorkflowStep (initiateAWorkflowStepInput: $initiateAWorkflowStepInput)
            }
      `,
    };

    const WorkflowName = 'TestWorkflowName';



    const getWorkflowByNameInput: GetWorkflowByNameInput = {
        OrgId: 'ORG#1234',
        WorkflowName,
    };

    const createWorkflowStepInput: CreateWorkflowStepInput = {
        WorkflowVersionSK: 'WV#1234',
        AID: '1234',
        NAID: ['AID#567'],
        ACT: {
            T: 'Manual Approval',
            NM: 'node_1',
            DESIGN: [],
            MD: {
                Email: 'test@lambdas.io',
            },
        },
    };

    const initiateAWorkflowStepInput: InitiateAWorkflowStepInput = {
        WorkflowExecutionKeys: {
            PK: 'testExecPK',
            SK: 'testExecSK',
        },
        WorkflowStepKeys: {
            PK: 'testExecPK',
            SK: 'testExecSK',
        },
        WorkflowStepExecutionHistorySK: 'testStepExecSK',
        OrgId: 'ORG#1234',
        WorkflowName: 'Workflow1',
        ActivityType: 'Manual Approval',
        Approve: true,
    };

    const getWorkflowsOfAnOrgInput: GetWorkflowsOfAnOrgInput = {
        orgId: 'ORG#1234',
        page: 1
    };

    const getWorkflowsOfAnOrgWithFilterInput: GetWorkflowsOfAnOrgInput = {
        orgId: 'ORG#1234',
        page: 1,
        search: WorkflowName
    };

    const saveWorkflowInput: SaveWorkflowInput = {
        PK: '',
        SK: '',
        STATUS: Status.DELETED,
    };


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


    it('should create the workflow', async () => {
        const endpoint = 'http://localhost:3001/api/graphql';

        const createOrganizationInput: CreateOrganizationInput = {
            ORGNAME: "TEST_ORGANIZATION",
            // ORGID: "ORG#1234"
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
        getWorkflowByNameInput.OrgId = organization.data.CreateOrganization.PK
        getWorkflowsOfAnOrgInput.orgId = organization.data.CreateOrganization.PK
        const createWorkflowPayload: IGraphqlPayload = {
            query: gql.createWorkflowMutation,
            variables: {
                createWorkflowInput: {
                    OrgId: organization.data.CreateOrganization.PK,
                    WorkflowName,
                    StartAt: 'node_1',
                    States: [
                        {
                            ActivityId: 'node_1',
                            ActivityType: 'Web Service',
                            NextActivities: ['node_2'],
                            Variables: {
                                Email: 'seth@lambdas.io',
                                Endpoint: 'https://restcountries.eu/rest/v2/name/Philippines',
                                Name: 'countries',
                            },
                        },
                        {
                            ActivityId: 'node_2',
                            ActivityType: 'Email',
                            End: true,
                            Variables: {
                                Email: 'test@email.com',
                                Subject: 'Testing',
                                Body: 'Message here',
                            },
                        },
                    ],
                }
            },
        };

        const createWorkflowResponse = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: createWorkflowPayload,
        })) as any;

        const workflowResult: CreateWorkflowResponse = createWorkflowResponse.data.CreateWorkflow;

        if (workflowResult.IsWorkflowNameExist) {
            expect(workflowResult.WorkflowKeys).toBeNull();
            expect(workflowResult.WorkflowVersionKeys).toBeNull();
            return;
        }

        expect(workflowResult.WorkflowKeys).not.toBeUndefined();
        expect(workflowResult.WorkflowVersionKeys).not.toBeUndefined();

        const WorkflowKeys = workflowResult.WorkflowKeys;
        const WorkflowVersionkeys = workflowResult.WorkflowVersionKeys;

        workflowKeysToDelete.push(WorkflowKeys);
        workflowVersionKeysToDelete.push(WorkflowVersionkeys);

        const getWorkflowByKeyInput: CompositePrimaryKeyInput = {
            PK: WorkflowKeys?.PK!,
            SK: WorkflowKeys?.SK!
        };

        const getWorkflowByKeyPayload: IGraphqlPayload = {
            query: gql.getWorkflowByKey,
            variables: { workflowKeysInput: getWorkflowByKeyInput },
        };

        const workflow = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: getWorkflowByKeyPayload,
        })) as any;

        expect(workflow.data.GetWorkflowByKey.WLFN).toEqual(WorkflowName);

        const getWorkflowVersionByKeyInput: CompositePrimaryKeyInput = {
            PK: WorkflowVersionkeys?.PK!,
            SK: WorkflowVersionkeys?.SK!
        };

        const getWorkflowVersionByKeyPayload: IGraphqlPayload = {
            query: gql.getWorkflowVersionByKey,
            variables: { workflowVersionKeysInput: getWorkflowVersionByKeyInput },
        };

        const workflowVersion = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: getWorkflowVersionByKeyPayload,
        })) as any;

        expect(workflowVersion.data.GetWorkflowVersionByKey.WV).toEqual(1);

        const getWorkflowStepWithinAVersionByKeyInput: string = workflowVersion.data.GetWorkflowVersionByKey.SK;

        const getWorkflowStepWithinAVersionByKeyPayload: IGraphqlPayload = {
            query: gql.getWorkflowStepWithinAVersion,
            variables: { workflowVersionSK: getWorkflowStepWithinAVersionByKeyInput },
        };

        const workflowSteps = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: getWorkflowStepWithinAVersionByKeyPayload,
        })) as any;

        expect(workflowSteps.data.GetWorkflowStepsWithinAVersion.length).toEqual(2);

        const EmailStep = workflowSteps.data.GetWorkflowStepsWithinAVersion.find((step) => step.ACT.T === 'Email');
        const WebService = workflowSteps.data.GetWorkflowStepsWithinAVersion.find((step) => step.ACT.T === 'Web Service');

        expect(EmailStep).not.toBeUndefined();
        expect(WebService).not.toBeUndefined();

        const workflowListPayload: IGraphqlPayload = {
            query: gql.getWorkflowsOfAnOrg,
            variables: { getWorkflowsOfAnOrgInput: getWorkflowsOfAnOrgInput },
        };

        const workflowList = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: workflowListPayload,
        })) as any;
        expect(workflowList.data.GetWorkflowsOfAnOrg.Workflows.length).toEqual(1);
        expect(workflowList.data.GetWorkflowsOfAnOrg.Error).toEqual(null);
    });

    it('should get workflow by name', async () => {
        const endpoint = 'http://localhost:3001/api/graphql';

        const getWorkflowPayload: IGraphqlPayload = {
            query: gql.getWorkflowByName,
            variables: { getWorkflowByNameInput: getWorkflowByNameInput },
        };

        const workflow = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: getWorkflowPayload,
        })) as any;
        console.log("[workflow]", workflow)

        saveWorkflowInput.PK = workflow.data.GetWorkflowByName.PK;
        saveWorkflowInput.SK = workflow.data.GetWorkflowByName.SK;
        expect(workflow.data.GetWorkflowByName).toEqual({
            PK: `${getWorkflowByNameInput.OrgId}|WLF-BATCH#1`,
            SK: `WLF#${WorkflowName}`,
            WLFN: WorkflowName,
            DATA: `WLF#${WorkflowName}`,
        });
    });

    it('should save the workflow', async () => {

        const endpoint = 'http://localhost:3001/api/graphql';

        const saveWorkflowPayload: IGraphqlPayload = {
            query: gql.saveWorkflowMutation,
            variables: { saveWorkflowInput: saveWorkflowInput },
        };

        const workflow = (await networkClient({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {},
            queryParams: {},
            bodyParams: saveWorkflowPayload,
        })) as any;

        expect(workflow.data.SaveWorkflow.PK).toEqual(saveWorkflowInput.PK);
        expect(workflow.data.SaveWorkflow.SK).toEqual(saveWorkflowInput.SK);
        expect(workflow.data.SaveWorkflow.STATUS).toEqual(saveWorkflowInput.STATUS);
    });

    describe('initiate a WORKFLOW STEP', () => {
        let workflowStep: any;

        beforeAll(async () => {
            const endpoint = 'http://localhost:3001/api/graphql';

            const workflowStepPayload: IGraphqlPayload = {
                query: gql.createWorkflowStep,
                variables: { createWorkflowStepInput: createWorkflowStepInput },
            };

            const workflowStepResult = (await networkClient({
                method: HttpMethod.POST,
                url: endpoint,
                headers: {},
                queryParams: {},
                bodyParams: workflowStepPayload,
            })) as any;

            workflowStep = workflowStepResult.data.CreateWorkflowStep;

            initiateAWorkflowStepInput.WorkflowStepKeys.PK = workflowStep.PK;
            initiateAWorkflowStepInput.WorkflowStepKeys.SK = workflowStep.SK;
        });

        it('should initiate workflow step', async () => {
            const endpoint = 'http://localhost:3001/api/graphql';

            const workflowStepPayload: IGraphqlPayload = {
                query: gql.initiateAWorkflowStep,
                variables: { initiateAWorkflowStepInput: initiateAWorkflowStepInput },
            };

            const workflowStepResult = (await networkClient({
                method: HttpMethod.POST,
                url: endpoint,
                headers: {},
                queryParams: {},
                bodyParams: workflowStepPayload,
            })) as any;

            expect(workflowStepResult.data.InitiateAWorkflowStep).toEqual('Successfuly Initiated Event');
        });
    });

    afterAll(async () => {
        await workflowApiContainer.stop();
        await localstackContainer.stop();
        await network.stop();
    });
});
