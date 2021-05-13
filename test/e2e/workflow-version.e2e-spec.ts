import { CompositePrimaryKeyInput } from 'src/graphql/common/inputs/workflow-key.input';
import { CreateWorkflowStepInput } from 'src/graphql/workflow-steps/inputs/create-workflow-step.input';
import { CreateWorkflowVersionInput } from 'src/graphql/workflow-versions/inputs/create-workflow-version.input';
import { GetWorkflowVersionDetailsInput } from 'src/graphql/workflow-versions/inputs/get-workflow-version-details.input';
import { SaveWorkflowVersionInput } from 'src/graphql/workflow-versions/inputs/save-workflow-version.input';
import { v4 } from 'uuid';
import { initiateGraphqlRequest, setUpTesting, tearDownTesting } from '../test-e2e';

const gql = {
  createWorkflowVersionMutation: `
    mutation CreateWorkflowVersion($createWorkflowVersionInput: CreateWorkflowVersionInput!){
      CreateWorkflowVersion(createWorkflowVersionInput: $createWorkflowVersionInput) {
        PK
        SK
        WV
        CID
        FAID
        TotalEXC
      }
    }
  `,
  getWorkflowVersionByKey: `
    query GetWorkflowVersionByKey($workflowVersionKeysInput: CompositePrimaryKeyInput!) {
      GetWorkflowVersionByKey(workflowVersionKeysInput: $workflowVersionKeysInput) {
        PK
        SK
        WV
        CID
        FAID
        TotalEXC
      }
    }
  `,
  saveWorkflowVersionMutation: `
    mutation SaveWorkflowVersion(
      $workflowVersionKeysInput: CompositePrimaryKeyInput!
      $saveWorkflowVersionInput: SaveWorkflowVersionInput!
    ) {
      SaveWorkflowVersion(
        workflowVersionKeysInput: $workflowVersionKeysInput,
        saveWorkflowVersionInput: $saveWorkflowVersionInput
      ) {
        PK
        SK
        WV
        FAID
        CID
        TotalEXC
      }
    }
  `,
  deleteWorkflowVersionMutation: `
    mutation DeleteWorkflowVersion($workflowVersionKeysInput: CompositePrimaryKeyInput!) {
      DeleteWorkflowVersion(workflowVersionKeysInput: $workflowVersionKeysInput)
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
  deleteWorkflowStepMutation: `
    mutation DeleteWorkflowVersion($workflowStepKeysInput: CompositePrimaryKeyInput!) {
      DeleteWorkflowStep(workflowStepKeysInput: $workflowStepKeysInput)
    }
  `,
  getWorkflowVersionDetails: `
    query GetWorkflowVersionDetails($getWorkflowVersionDetailsInput: GetWorkflowVersionDetailsInput!) {
      GetWorkflowVersionDetails(getWorkflowVersionDetailsInput: $getWorkflowVersionDetailsInput) {
        WorkflowVersionSK
        Activities {
          T
          NM
        }
        Design {
          id
          position {
            x
            y
          }
        }
      }
    }
  `,
};

const OrgId = 'ORG#1234';

const createWorkflowVersionInput: CreateWorkflowVersionInput = {
  WLFID: `${OrgId}|WLF#1`,
  WV: '1',
  FAID: '[1, 2, 3]',
  CID: v4(),
};

const workflowVersionKeysInput: CompositePrimaryKeyInput = {
  PK: '',
  SK: '',
};

const saveWorkflowVersionInput: SaveWorkflowVersionInput = {
  WV: '2',
  TotalEXC: 1,
};

const createWorkflowStepInput = {
  WorkflowVersionSK: 'WV#test1234',
  NAID: ['AID#567'],
};

const getWorkflowVersionDetailsInput: GetWorkflowVersionDetailsInput = {
  WorkflowVersionSK: createWorkflowStepInput.WorkflowVersionSK,
};

describe('WorkflowVersionResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflowVersion', () => {
    it('should create the workflow version', async () => {
      const data = await initiateGraphqlRequest(gql.createWorkflowVersionMutation, { createWorkflowVersionInput });

      expect(data.CreateWorkflowVersion.PK).toEqual(createWorkflowVersionInput.WLFID);
      expect(data.CreateWorkflowVersion.WV).toEqual(createWorkflowVersionInput.WV);
      expect(data.CreateWorkflowVersion.FAID).toEqual(createWorkflowVersionInput.FAID);
      expect(data.CreateWorkflowVersion.CID).toEqual(createWorkflowVersionInput.CID);
      expect(data.CreateWorkflowVersion.TotalEXC).toEqual(0);

      workflowVersionKeysInput.PK = data.CreateWorkflowVersion.PK;
      workflowVersionKeysInput.SK = data.CreateWorkflowVersion.SK;
    });
  });

  describe('getWorkflowVersionByKey', () => {
    it('should get the specific workflow version', async () => {
      const data = await initiateGraphqlRequest(gql.getWorkflowVersionByKey, { workflowVersionKeysInput });

      expect(data.GetWorkflowVersionByKey.PK).toEqual(createWorkflowVersionInput.WLFID);
      expect(data.GetWorkflowVersionByKey.WV).toEqual(createWorkflowVersionInput.WV);
      expect(data.GetWorkflowVersionByKey.FAID).toEqual(createWorkflowVersionInput.FAID);
      expect(data.GetWorkflowVersionByKey.CID).toEqual(createWorkflowVersionInput.CID);
      expect(data.GetWorkflowVersionByKey.TotalEXC).toEqual(0);
    });
  });

  describe('saveWorkflowVersion', () => {
    it('should save the workflow version', async () => {
      const data = await initiateGraphqlRequest(gql.saveWorkflowVersionMutation, {
        workflowVersionKeysInput,
        saveWorkflowVersionInput,
      });

      expect(data.SaveWorkflowVersion.WV).toEqual('2');
      expect(data.SaveWorkflowVersion.TotalEXC).toEqual(1);
    });
  });

  describe('deleteWorkflowVersion', () => {
    it('should delete the workflow version', async () => {
      const data1 = await initiateGraphqlRequest(gql.deleteWorkflowVersionMutation, { workflowVersionKeysInput });
      expect(data1.DeleteWorkflowVersion).toBeNull();

      const data2 = await initiateGraphqlRequest(gql.getWorkflowVersionByKey, { workflowVersionKeysInput });
      expect(data2.GetWorkflowVersionByKey).toBeNull();
    });
  });

  describe('getWorkflowVersionDetails', () => {
    // set workflow step values
    const ws1: CreateWorkflowStepInput = {
      ...createWorkflowStepInput,
      AID: '11',
      ACT: {
        T: 'Manual Approval',
        NM: 'node_1',
        DESIGN: [
          {
            id: 'node_1',
            position: {
              x: 450,
              y: 400,
            },
          },
        ],
        MD: {
          Email: 'test@lambdas.io',
        },
      },
    };

    const ws2: CreateWorkflowStepInput = {
      ...createWorkflowStepInput,
      AID: '12',
      ACT: {
        T: 'Email',
        NM: 'node_2',
        DESIGN: [
          {
            id: 'node_2',
            position: {
              x: 250,
              y: 100,
            },
          },
        ],
        MD: {
          Email: 'test@lambdas.io',
        },
      },
    };

    let workflowStepResult1: any;
    let workflowStepResult2: any;

    beforeAll(async () => {
      const data1 = await initiateGraphqlRequest(gql.createWorkflowStep, { createWorkflowStepInput: ws1 });
      const data2 = await initiateGraphqlRequest(gql.createWorkflowStep, { createWorkflowStepInput: ws2 });

      workflowStepResult1 = data1.CreateWorkflowStep;
      workflowStepResult2 = data2.CreateWorkflowStep;
    });

    // cleanup
    afterAll(async () => {
      await initiateGraphqlRequest(gql.deleteWorkflowStepMutation, {
        workflowStepKeysInput: { PK: workflowStepResult1.PK, SK: workflowStepResult1.SK },
      });
      await initiateGraphqlRequest(gql.deleteWorkflowStepMutation, {
        workflowStepKeysInput: { PK: workflowStepResult2.PK, SK: workflowStepResult2.SK },
      });
    });

    it('should get workflow version details', async () => {
      const data = await initiateGraphqlRequest(gql.getWorkflowVersionDetails, { getWorkflowVersionDetailsInput });
      const workflowVersionDetails = data.GetWorkflowVersionDetails;

      const node1 = workflowVersionDetails.Activities.find((act: any) => act.NM === ws1.ACT.NM);
      const node2 = workflowVersionDetails.Activities.find((act: any) => act.NM === ws2.ACT.NM);

      const ws1NodeDesign = workflowVersionDetails.Design.find((design: any) => design.id === ws1.ACT.DESIGN[0].id);
      const ws2NodeDesign = workflowVersionDetails.Design.find((design: any) => design.id === ws2.ACT.DESIGN[0].id);

      expect(node1.T).toEqual('Manual Approval');
      expect(node2.T).toEqual('Email');
      expect(ws1NodeDesign.position).toEqual({
        x: 450,
        y: 400,
      });
      expect(ws2NodeDesign.position).toEqual({
        x: 250,
        y: 100,
      });
    });
  });
});
