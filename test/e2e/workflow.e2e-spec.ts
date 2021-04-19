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
      NextActivities: ['step_4', 'step_3'],
      Variables: {
        Variable: 'foo',
        Operator: '=',
        RightHand: '3',
      },
    },
    {
      ActivityId: 'step_3',
      ActivityType: 'AssignData',
      NextActivities: ['step_5'],
      Variables: { Data: '{ Field: "Value" }' },
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
      ActivityType: 'WebService',
      NextActivities: ['step_6'],
      Variables: { Endpoint: 'https://google.com' },
    },
    {
      ActivityId: 'step_6',
      ActivityType: 'ParallelStart',
      NextActivities: ['step_7', 'step_8'],
    },
    {
      ActivityId: 'step_7',
      ActivityType: 'WebService',
      NextActivities: ['step_9'],
      Variables: { Endpoint: 'https://google.com' },
    },
    {
      ActivityId: 'step_8',
      ActivityType: 'WebService',
      NextActivities: ['step_9'],
      Variables: { Endpoint: 'https://google.com' },
    },
    {
      ActivityId: 'step_9',
      ActivityType: 'ManualInput',
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
      }
    });
  });
});
