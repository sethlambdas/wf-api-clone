import * as request from 'supertest';
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
};

const createWorkflowInput = {
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
            const ACT = JSON.parse(workflowStep.ACT);
            return ACT.T === state.ActivityType && ACT.NM === state.ActivityId;
          }),
        ).toBe(true);

        expect(
          workflowSteps.some((workflowStep) => {
            const ACT = JSON.parse(workflowStep.ACT);
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
});
