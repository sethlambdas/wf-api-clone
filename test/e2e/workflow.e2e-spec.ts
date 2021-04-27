import * as request from 'supertest';
import { CreateWorkflowInput } from '../../src/graphql/workflow/inputs/create-workflow.input';
import { GetWorkflowDetailsInput } from '../../src/graphql/workflow/inputs/get-workflow.input';
import {
  getHttpServerTesting,
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
        WSID
        CAT {
          T
          DESIGN {
            id
          }
        }
      }
    }
  `,
};

const createWorkflowInput: CreateWorkflowInput = {
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

describe('WorkflowResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflow', () => {
    it('should create the workflow', async () => {
      const {
        body: { data },
      } = await request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.createWorkflowMutation,
          variables: {
            createWorkflowInput,
          },
        })
        .expect(200);
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
    it('should get workflow execution details', async () => {
      // Create workflow execution through resolver
      const {
        body: { data: result1 },
      } = await request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.createWorkflowExection,
          variables: {
            createWorkflowExecutionInput,
          },
        })
        .expect(200);

      // test the GetWorkflowDetails
      const {
        body: { data: result2 },
      } = await request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.getWorkflowDetails,
          variables: {
            getWorkflowDetailsInput: {
              WID: 'dummy',
              WVID: result1.CreateWorkflowExecution.WVID,
            },
          },
        })
        .expect(200);

      expect(result2.GetWorkflowDetails.WVID).toEqual(result1.CreateWorkflowExecution.WVID);
      expect(result2.GetWorkflowDetails.ACTIVITIES[0].T).toEqual(result1.CreateWorkflowExecution.CAT[0].T);
      expect(result2.GetWorkflowDetails.DESIGN[0].id).toEqual(result1.CreateWorkflowExecution.CAT[0].DESIGN[0].id);
    });
  });
});
