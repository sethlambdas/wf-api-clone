import { CompositePrimaryKeyInput } from '../../src/graphql/common/inputs/workflow-key.input';
import { CreateWorkflowStepInput } from '../../src/graphql/workflow-steps/inputs/create-workflow-step.input';
import { GetWorkflowStepByAidInput } from '../../src/graphql/workflow-steps/inputs/get-workflow-step-by-aid.input';
import { SaveWorkflowStepInput } from '../../src/graphql/workflow-steps/inputs/save-workflow-step.input';
import { initiateGraphqlRequest, setUpTesting, tearDownTesting } from '../test-e2e';

const gql = {
  createWorkflowStepMutation: `
    mutation CreateWorkflowStep($createWorkflowStepInput: CreateWorkflowStepInput!) {
      CreateWorkflowStep(createWorkflowStepInput: $createWorkflowStepInput) {
        PK
        SK
        AID
        NAID
        ACT {
          T
        }
      }
    }
  `,
  getWorkflowStepBykey: `
    query GetWorkflowStepByKey($workflowStepKeysInput: CompositePrimaryKeyInput!) {
      GetWorkflowStepByKey(workflowStepKeysInput: $workflowStepKeysInput) {
        PK
        SK
        AID
        NAID
        DATA
        ACT {
          T
          NM
        }
      }
    }
  `,
  saveWorkflowStepMutation: `
    mutation CreateWorkflowStep(
      $saveWorkflowStepInput: SaveWorkflowStepInput!
      $workflowStepKeysInput: CompositePrimaryKeyInput!
    ) {
      SaveWorkflowStep(
        saveWorkflowStepInput: $saveWorkflowStepInput,
        workflowStepKeysInput: $workflowStepKeysInput
      ) {
        PK
        SK
        AID
        NAID
        DATA
        ACT {
          T
          NM
          MD {
            Email
          }
        }
      }
    }
  `,
  getWorkflowStepByAid: `
    query GetWorkflowStepByAid($getWorkflowStepByAidInput: GetWorkflowStepByAidInput!) {
      GetWorkflowStepByAid(getWorkflowStepByAidInput: $getWorkflowStepByAidInput) {
        PK
        SK
        AID
        NAID
        ACT {
          T
          NM
        }
      }
    }
  `,
  deleteWorkflowStepMutation: `
    mutation DeleteWorkflowVersion($workflowStepKeysInput: CompositePrimaryKeyInput!) {
      DeleteWorkflowStep(workflowStepKeysInput: $workflowStepKeysInput)
    }
  `,
  getWorkflowStepsWithinAVersion: `
    query GetWorkflowStepsWithinAVersion($workflowVersionSK: String!) {
      GetWorkflowStepsWithinAVersion(workflowVersionSK: $workflowVersionSK) {
        PK
        SK
        AID
        DATA
        NAID
        ACT {
          T
          NM
        }
      }
    }
  `,
};

const createWorkflowStepInput: CreateWorkflowStepInput = {
  WorkflowVersionSK: 'WV#1234',
  AID: '1234',
  NAID: ['AID#567'],
  ACT: {
    T: 'Email',
    NM: 'node_1',
    MD: {
      Email: 'test@lambdas.io',
    },
    DESIGN: [],
  },
};

const workflowStepKeysInput: CompositePrimaryKeyInput = {
  PK: '',
  SK: '',
};

const saveWorkflowStepInput: SaveWorkflowStepInput = {
  AID: 'AID#NEW123',
  DATA: 'AID#NEW123',
};

const getWorkflowStepByAidInput: GetWorkflowStepByAidInput = {
  WorkflowStepPK: createWorkflowStepInput.WorkflowVersionSK,
  AID: 'AID#NEW123',
};

describe('WorkflowStepResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflowStep', () => {
    it('should create the workflow step', async () => {
      const data = await initiateGraphqlRequest(gql.createWorkflowStepMutation, { createWorkflowStepInput });
      const workflowStep = data.CreateWorkflowStep;

      expect(workflowStep.PK).toEqual(createWorkflowStepInput.WorkflowVersionSK);
      expect(workflowStep.AID).toEqual(`AID#${createWorkflowStepInput.AID}`);
      expect(workflowStep.NAID).toEqual(createWorkflowStepInput.NAID);
      expect(workflowStep.ACT.T).toEqual(createWorkflowStepInput.ACT.T);

      workflowStepKeysInput.PK = workflowStep.PK;
      workflowStepKeysInput.SK = workflowStep.SK;
    });
  });

  describe('getWorkflowStepByKey', () => {
    it('should get the specific workflow step', async () => {
      const data = await initiateGraphqlRequest(gql.getWorkflowStepBykey, { workflowStepKeysInput });
      const workflowStep = data.GetWorkflowStepByKey;

      expect(workflowStep.PK).toEqual(createWorkflowStepInput.WorkflowVersionSK);
      expect(workflowStep.AID).toEqual(`AID#${createWorkflowStepInput.AID}`);
      expect(workflowStep.ACT.T).toEqual(createWorkflowStepInput.ACT.T);
    });
  });

  describe('saveWorkflowStep', () => {
    it('should save the workflow step', async () => {
      const data = await initiateGraphqlRequest(gql.saveWorkflowStepMutation, {
        workflowStepKeysInput,
        saveWorkflowStepInput,
      });
      const workflowStep = data.SaveWorkflowStep;

      expect(workflowStep.AID).toEqual(saveWorkflowStepInput.AID);
      expect(workflowStep.DATA).toEqual(saveWorkflowStepInput.DATA);
    });
  });

  describe('getWorkflowStepByAid', () => {
    it('should get the specific workflow step by AID', async () => {
      const data = await initiateGraphqlRequest(gql.getWorkflowStepByAid, { getWorkflowStepByAidInput });
      const workflowStep = data.GetWorkflowStepByAid;

      expect(workflowStep.PK).toEqual(createWorkflowStepInput.WorkflowVersionSK);
      expect(workflowStep.ACT.T).toEqual(createWorkflowStepInput.ACT.T);
      expect(workflowStep.AID).toEqual(saveWorkflowStepInput.AID);
    });
  });

  describe('deleteWorkflowStep', () => {
    it('should delete the workflow step', async () => {
      const data1 = await initiateGraphqlRequest(gql.deleteWorkflowStepMutation, { workflowStepKeysInput });
      expect(data1.DeleteWorkflowStep).toBeNull();

      const data2 = await initiateGraphqlRequest(gql.getWorkflowStepBykey, { workflowStepKeysInput });
      expect(data2.GetWorkflowStepByKey).toBeNull();
    });
  });

  describe('getWorkflowStepsWithinAVersion', () => {
    const steps = [
      { ...createWorkflowStepInput, AID: '11' },
      { ...createWorkflowStepInput, AID: '12' },
    ];

    beforeAll(async () => {
      for (const step of steps)
        await initiateGraphqlRequest(gql.createWorkflowStepMutation, { createWorkflowStepInput: step });
    });

    it('should get the workflow steps within a workflow version', async () => {
      const data = await initiateGraphqlRequest(gql.getWorkflowStepsWithinAVersion, {
        workflowVersionSK: createWorkflowStepInput.WorkflowVersionSK,
      });
      const workflowSteps = data.GetWorkflowStepsWithinAVersion;

      const workflowStep1 = workflowSteps.find((step: any) => step.AID === `AID#${steps[0].AID}`);
      const workflowStep2 = workflowSteps.find((step: any) => step.AID === `AID#${steps[1].AID}`);

      expect(workflowStep1).not.toBeUndefined();
      expect(workflowStep2).not.toBeUndefined();
    });
  });
});
