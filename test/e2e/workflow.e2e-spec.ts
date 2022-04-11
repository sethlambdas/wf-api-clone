import {
  initiateGraphqlRequest,
  organizationService,
  setUpTesting,
  tearDownTesting,
  workflowRepository,
  workflowService,
  workflowStepService,
  workflowVersionService,
} from '../test-e2e';

import { CreateWorkflowStepInput } from '../../src/graphql/workflow-steps/inputs/post.inputs';

import { CreateWorkflowInput, InitiateAWorkflowStepInput } from '../../src/graphql/workflow/inputs/post.inputs';
import { GetWorkflowByNameInput, GetWorkflowsOfAnOrgInput } from '../../src/graphql/workflow/inputs/get.inputs';
import { SaveWorkflowInput } from '../../src/graphql/workflow/inputs/put.inputs';
import { Status } from '../../src/graphql/workflow/workflow.entity';

const gql = {
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
  initiateCurrentStep: `
    query InitiateCurrentStep($InititalAWorkflowStep: InititalAWorkflowStep!) {
      InitiateCurrentStep(InititalAWorkflowStep: $InititalAWorkflowStep)
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
  initiateAWorkflowStep: `
    mutation InitiateAWorkflowStep ($initiateAWorkflowStepInput: InitiateAWorkflowStepInput!) {
      InitiateAWorkflowStep (initiateAWorkflowStepInput: $initiateAWorkflowStepInput)
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
};

const WorkflowName = 'TestWorkflowName';

const createWorkflowInput: CreateWorkflowInput = {
  OrgId: 'Will Change After Create Organization Test Execute',
  WorkflowName,
  StartAt: 'node_1',
  States: [
    {
      ActivityId: 'node_1',
      ActivityType: 'Web Service',
      NextActivities: ['node_2'],
      Variables: {
        Email: 'marco@lambdas.io',
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
};

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

describe('WorkflowResolver (e2e)', () => {
  const workflowKeysToDelete = [];
  const workflowVersionKeysToDelete = [];
  const orgId = 'ORG#1234';

  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflow', () => {
    it('should create the workflow', async () => {
      createWorkflowInput.OrgId = orgId;
      const data = await initiateGraphqlRequest(gql.createWorkflowMutation, { createWorkflowInput });

      if (data.CreateWorkflow?.IsWorkflowNameExist) {
        expect(data.CreateWorkflow.WorkflowKeys).toBeNull();
        expect(data.CreateWorkflow.WorkflowVersionKeys).toBeNull();
        return;
      }

      expect(data.CreateWorkflow.WorkflowKeys).not.toBeUndefined();
      expect(data.CreateWorkflow.WorkflowVersionKeys).not.toBeUndefined();

      const WorkflowKeys = data.CreateWorkflow.WorkflowKeys;
      const WorkflowVersionkeys = data.CreateWorkflow.WorkflowVersionKeys;

      workflowKeysToDelete.push(WorkflowKeys);
      workflowVersionKeysToDelete.push(WorkflowVersionkeys);

      const workflow = await workflowService.getWorkflowByKey(WorkflowKeys);
      expect(workflow.WLFN).toEqual(createWorkflowInput.WorkflowName);

      const workflowVersion = await workflowVersionService.getWorkflowVersionByKey(WorkflowVersionkeys);
      expect(workflowVersion.WV).toEqual(1);

      const workflowSteps = await workflowStepService.getWorkflowStepWithinAVersion(workflowVersion.SK);
      expect(workflowSteps.count).toEqual(2);

      const EmailStep = workflowSteps.find((step) => step.ACT.T === 'Email');
      const WebService = workflowSteps.find((step) => step.ACT.T === 'Web Service');

      expect(EmailStep).not.toBeUndefined();
      expect(WebService).not.toBeUndefined();
    });
  });

  describe('GetWorkflowByName', () => {
    it('should get workflow by name', async () => {
      getWorkflowByNameInput.OrgId = orgId;
      const data = await initiateGraphqlRequest(gql.getWorkflowByName, { getWorkflowByNameInput });
      saveWorkflowInput.PK = data.GetWorkflowByName.PK;
      saveWorkflowInput.SK = data.GetWorkflowByName.SK;
      expect(data.GetWorkflowByName).toEqual({
        PK: `${orgId}|WLF-BATCH#1`,
        SK: `WLF#${WorkflowName}`,
        WLFN: WorkflowName,
        DATA: `WLF#${WorkflowName}`,
      });
    });
  });

  describe('saveWorkflow', () => {
    it('should save the workflow', async () => {
      const data = await initiateGraphqlRequest(gql.saveWorkflowMutation, { saveWorkflowInput });
      expect(data.SaveWorkflow.PK).toEqual(saveWorkflowInput.PK);
      expect(data.SaveWorkflow.SK).toEqual(saveWorkflowInput.SK);
      expect(data.SaveWorkflow.STATUS).toEqual(saveWorkflowInput.STATUS);
    });
  });

  describe('inititateWorkflowStep', () => {
    let workflowStep: any;

    beforeAll(async () => {
      // Create workflow step
      const data = await initiateGraphqlRequest(gql.createWorkflowStep, { createWorkflowStepInput });
      workflowStep = data.CreateWorkflowStep;

      initiateAWorkflowStepInput.WorkflowStepKeys.PK = workflowStep.PK;
      initiateAWorkflowStepInput.WorkflowStepKeys.SK = workflowStep.SK;
    });

    it('should initiate workflow step', async () => {
      const data = await initiateGraphqlRequest(gql.initiateAWorkflowStep, { initiateAWorkflowStepInput });
      expect(data.InitiateAWorkflowStep).toEqual('Successfuly Initiated Event');
    });
  });

  describe('getWorkflowsOfAnOrg', () => {
    it('should list workflows of an organization', async () => {
      const data = await initiateGraphqlRequest(gql.getWorkflowsOfAnOrg, { getWorkflowsOfAnOrgInput });
      expect(data.GetWorkflowsOfAnOrg.Workflows.length).toEqual(1);
      expect(data.GetWorkflowsOfAnOrg.Error).toEqual(null);
    });
  });

  describe('getWorkflowsOfAnOrg', () => {
    it('should list workflows of an organization with search filter', async () => {
      const data = await initiateGraphqlRequest(gql.getWorkflowsOfAnOrg, { getWorkflowsOfAnOrgInput: getWorkflowsOfAnOrgWithFilterInput });
      expect(data.GetWorkflowsOfAnOrg.Workflows.length).toEqual(1);
      expect(data.GetWorkflowsOfAnOrg.Error).toEqual(null);
    });
  });
});
