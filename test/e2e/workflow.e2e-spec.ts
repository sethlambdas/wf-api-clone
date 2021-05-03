import * as request from 'supertest';
import { CreateWorkflowStepInput } from '../../src/graphql/workflow-steps/inputs/create-workflow-step.input';
import { CreateWorkflowInput } from '../../src/graphql/workflow/inputs/create-workflow.input';
import { InitiateCurrentStepInput } from '../../src/graphql/workflow/inputs/initiate-step.input';
import {
  getHttpServerTesting,
  initiateGraphqlRequest,
  setUpTesting,
  tearDownTesting,
  workflowStepService,
  workflowVersionService,
} from '../test-e2e';

const gql = {
  createWorkflowMutation: `
    mutation CreateWorkflow($createWorkflowInput: CreateWorkflowInput!) {
      CreateWorkflow(createWorkflowInput: $createWorkflowInput)
    }
  `,
  getWorkflowDetails: `
    query GetWorkflowDetails($getWorkflowDetailsInput: GetWorkflowDetailsInput!) {
      GetWorkflowDetails(getWorkflowDetailsInput: $getWorkflowDetailsInput) {
        WVID
        ACTIVITIES {
          T
        }
        DESIGN {
          id
        }
      }
    }
  `,
  createWorkflowExection: `
    mutation CreateWorkflowExecution($createWorkflowExecutionInput: CreateWorkflowExecutionInput!) {
      CreateWorkflowExecution(createWorkflowExecutionInput: $createWorkflowExecutionInput) {
        WXID
        WVID
        CAT {
          T
          DESIGN {
            id
          }
        }
      }
    }
  `,
  createWorkflowStep: `
    mutation CreateWorkflowStep($createWorkflowStepInput: CreateWorkflowStepInput!) {
      CreateWorkflowStep(createWorkflowStepInput: $createWorkflowStepInput) {
        WSID
        WVID
        AID
        ACT {
          T
        }
      }
    }
  `,
  initiateCurrentStep: `
    query InitiateCurrentStep($initiateCurrentStepInput: InitiateCurrentStepInput!) {
      InitiateCurrentStep(initiateCurrentStepInput: $initiateCurrentStepInput)
    }
  `,
  listWorkflows: `
    query ListWorkflows($listWorkflowInput: ListWorkflowInput!) {
      ListWorkflows(listWorkflowsInput: $listWorkflowInput) {
        Workflows {
          WXID
          WLFN
          CRAT
        }
        LastKey {
          CRAT
        }
        TotalRecords
      }
    }
  `,
  deleteWorkflowExecution: `
    mutation DeleteWorkflowExecution($id: String!) {
      DeleteWorkflowExecution(id: $id)
    }
  `,
};

const createWorkflowStepInput: CreateWorkflowStepInput = {
  WVID: 'WVID123',
  AID: 'AID123',
  NAID: [],
  ACT: {
    T: 'Manual Input',
    NM: 'node_0',
    MD: {
      Completed: false,
    },
    DESIGN: [],
    END: true,
  },
};

const initiateCurrentStepInput: InitiateCurrentStepInput = {
  WSID: '',
  ActivityType: 'Manual Input',
  Approve: true,
};

const createWorkflowInput: CreateWorkflowInput = {
  WLFN: 'SampleWorkflow1',
  Design: [
    {
      id: 'step_0',
      style: 'general',
      data: {
        label: {
          iconName: 'StartIcon',
          name: 'Start',
        },
        nodeType: 'Start',
        labelIconName: 'StartIcon',
        state: 'Start',
      },
      position: {
        x: 250,
        y: 100,
      },
    },
    {
      id: 'step_1',
      style: 'general',
      data: {
        label: {
          iconName: 'WebIcon',
          name: 'Web Service',
        },
        nodeType: 'WebService',
        labelIconName: 'WebIcon',
        state: 'WebService',
      },
      position: {
        x: 250,
        y: 200,
      },
    },
    {
      id: 'step_2',
      style: 'general',
      data: {
        label: {
          iconName: 'EndIcon',
          name: 'End',
        },
        nodeType: 'End',
        labelIconName: 'EndIcon',
        state: 'End',
      },
      position: {
        x: 250,
        y: 300,
      },
    },
    {
      id: 'edge_0',
      source: 'step_0',
      target: 'step_1',
      type: 'step',
    },
    {
      id: 'edge_1',
      source: 'step_1',
      target: 'step_2',
      type: 'step',
    },
  ],
  StartAt: 'step_1',
  States: [
    {
      ActivityId: 'step_1',
      ActivityType: 'Email',
      NextActivities: ['step_2'],
      Variables: { Email: 'test@email.com' },
    },
    {
      ActivityId: 'step_2',
      ActivityType: 'Condition',
      Variables: {
        Choices: [
          {
            Variable: 'foo',
            Operator: '=',
            RightHand: '3',
            Next: 'step_3',
          },
        ],
        DefaultNext: 'step_4',
      },
    },
    {
      ActivityId: 'step_3',
      ActivityType: 'Assign Data',
      NextActivities: ['step_5'],
      Variables: { FieldValues: '{ Field: "Value" }' },
    },
    {
      ActivityId: 'step_4',
      ActivityType: 'Delay',
      NextActivities: ['step_3'],
      Variables: {
        Hours: 'Value',
        Minutes: 'Value',
        Seconds: 'Values',
      },
    },
    {
      ActivityId: 'step_5',
      ActivityType: 'Web Service',
      NextActivities: ['step_6'],
      Variables: { Endpoint: 'https://google.com' },
    },
    {
      ActivityId: 'step_6',
      ActivityType: 'Parallel Start',
      NextActivities: ['step_7', 'step_8'],
    },
    {
      ActivityId: 'step_7',
      ActivityType: 'Web Service',
      NextActivities: ['step_9'],
      Variables: { Endpoint: 'https://google.com' },
    },
    {
      ActivityId: 'step_8',
      ActivityType: 'Web Service',
      NextActivities: ['step_9'],
      Variables: { Endpoint: 'https://google.com' },
    },
    {
      ActivityId: 'step_9',
      ActivityType: 'Manual Input',
      Variables: { Completed: false },
      End: true,
    },
  ],
};

const createWorkflowExecutionInput = {
  WVID: 'WVID123',
  WSID: ' WSID123',
  WLFN: 'SampleWorkflow100',
  CRAT: 'Email',
  CAT: [
    {
      T: 'Email',
      Status: 'Finished',
      DESIGN: [
        {
          id: 'node_0',
          style: '{width: 100, height: 50px}',
          position: {
            x: 100,
            y: 120,
          },
          data: {
            nodeType: 'Start',
            state: 'Start',
            labelIconName: 'StartIcon',
          },
        },
      ],
    },
  ],
};

const executionInputs = [
  {
    WVID: 'WVID1',
    WSID: ' WSID1',
    WLFN: 'SampleWorkflowTest1',
    CRAT: 'EmailType',
    CAT: [],
  },
  {
    WVID: 'WVID2',
    WSID: ' WSID2',
    WLFN: 'SampleWorkflowTest2',
    CRAT: 'ManualType',
    CAT: [],
  },
  {
    WVID: 'WVID3',
    WSID: ' WSID3',
    WLFN: 'SampleWorkflowTest3',
    CRAT: 'EmailType',
    CAT: [],
  },
  {
    WVID: 'WVID4',
    WSID: ' WSID4',
    WLFN: 'SampleWorkflowTest4',
    CRAT: 'ManualType',
    CAT: [],
  },
];

const listWorkflowInput1 = {
  CRAT: 'ManualType',
  pageSize: 1,
  page: 1,
};

describe('WorkflowResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflow', () => {
    it('should create the workflow', async () => {
      const data = await initiateGraphqlRequest(gql.createWorkflowMutation, { createWorkflowInput });
      const createWorkflow = data.CreateWorkflow;

      const workflowVersions = await workflowVersionService.listWorkflowVersions();
      expect(
        workflowVersions.some((workflowVersion) => {
          return workflowVersion.WID === createWorkflow && workflowVersion.WV === '1';
        }),
      ).toBe(true);

      const workflowSteps = await workflowStepService.listWorkflowSteps();
      for (const state of createWorkflowInput.States) {
        expect(
          workflowSteps.some((workflowStep) => {
            const ACT = workflowStep.ACT;
            return ACT.T === state.ActivityType && ACT.NM === state.ActivityId;
          }),
        ).toBe(true);

        expect(
          workflowSteps.some((workflowStep) => {
            const ACT = workflowStep.ACT;
            if (!ACT.DESIGN || !Array.isArray(ACT.DESIGN)) return true;
            return createWorkflowInput.Design.find((design) => {
              return ACT.DESIGN.find((actDesign) => {
                return design.id === actDesign.id;
              });
            });
          }),
        ).toBe(true);
      }
    });
  });

  describe('getWorkflowDetails', () => {
    let wxid = 0;
    let result1: any;
    beforeAll(async () => {
      result1 = await initiateGraphqlRequest(gql.createWorkflowExection, { createWorkflowExecutionInput });
      wxid = result1.CreateWorkflowExecution.WXID;
    });

    afterAll(async () => {
      await initiateGraphqlRequest(gql.deleteWorkflowExecution, { id: wxid });
    });

    it('should get workflow execution details', async () => {
      // test the GetWorkflowDetails
      const result2 = await initiateGraphqlRequest(gql.getWorkflowDetails, {
        getWorkflowDetailsInput: {
          WID: 'dummy',
          WVID: result1.CreateWorkflowExecution.WVID,
        },
      });

      expect(result2.GetWorkflowDetails.WVID).toEqual(result1.CreateWorkflowExecution.WVID);
      expect(result2.GetWorkflowDetails.ACTIVITIES[0].T).toEqual(result1.CreateWorkflowExecution.CAT[0].T);
      expect(result2.GetWorkflowDetails.DESIGN[0].id).toEqual(result1.CreateWorkflowExecution.CAT[0].DESIGN[0].id);
    });
  });

  describe('inititateWorkflowStep', () => {
    it('should initiate workflow step', async () => {
      // Create workflow step
      const result1 = await initiateGraphqlRequest(gql.createWorkflowStep, { createWorkflowStepInput });
      initiateCurrentStepInput.WSID = result1.CreateWorkflowStep.WSID;

      const result2 = await initiateGraphqlRequest(gql.initiateCurrentStep, { initiateCurrentStepInput });

      expect(result2.InitiateCurrentStep).toEqual('Successfuly Initiated Event');
    });
  });

  describe('ListWorkflows', () => {
    const executionsToDelete = [];
    beforeAll(async () => {
      for (const inputs of executionInputs) {
        const result = await initiateGraphqlRequest(gql.createWorkflowExection, {
          createWorkflowExecutionInput: inputs,
        });
        executionsToDelete.push(result.CreateWorkflowExecution.WXID);
      }
    });

    afterAll(async () => {
      for (const id of executionsToDelete) await initiateGraphqlRequest(gql.deleteWorkflowExecution, { id });
    });

    it('should list workflows based on CRAT variable', async () => {
      const data = await initiateGraphqlRequest(gql.listWorkflows, { listWorkflowInput: listWorkflowInput1 });
      expect(data.ListWorkflows.Workflows.length).toEqual(1);
      expect(data.ListWorkflows.Workflows[0].CRAT).toEqual('ManualType');
      expect(data.ListWorkflows.LastKey).toMatchObject({ CRAT: 'ManualType' });
      expect(data.ListWorkflows.TotalRecords).toEqual(2);
    });

    it('should list all workflows', async () => {
      const data = await initiateGraphqlRequest(gql.listWorkflows, { listWorkflowInput: { pageSize: 4, page: 1 } });
      expect(data.ListWorkflows.Workflows.length).toEqual(4);
      expect(data.ListWorkflows.TotalRecords).toEqual(4);
    });

    it('should paginate through workflows', async () => {
      const page1Data = await initiateGraphqlRequest(gql.listWorkflows, {
        listWorkflowInput: { pageSize: 2, page: 1 },
      });
      expect(page1Data.ListWorkflows.Workflows.length).toEqual(2);

      const page2Data = await initiateGraphqlRequest(gql.listWorkflows, {
        listWorkflowInput: { pageSize: 2, page: 2 },
      });
      expect(page2Data.ListWorkflows.Workflows.length).toEqual(2);

      expect(page1Data.ListWorkflows.Workflows[0].WXID).not.toEqual(page2Data.ListWorkflows.Workflows[0].WXID);
      expect(page1Data.ListWorkflows.TotalRecords).toEqual(4);
    });
  });
});
