import { CreateOrganizationInput } from 'src/graphql/organizations/inputs/create-organization.input';
import { GetWorkflowByNameInput } from 'src/graphql/workflow/inputs/get-workflow-by-name.input';
import { ListWorkflowsOfAnOrgInput } from 'src/graphql/workflow/inputs/list-workflows.input';
import { CreateWorkflowStepInput } from '../../src/graphql/workflow-steps/inputs/create-workflow-step.input';
import { CreateWorkflowInput } from '../../src/graphql/workflow/inputs/create-workflow.input';
import { InitiateAWorkflowStepInput } from '../../src/graphql/workflow/inputs/initiate-step.input';
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

const gql = {
  CreateOrganization: `
    mutation CreateOrganization($createOrganizationInput: CreateOrganizationInput!) {
      CreateOrganization(createOrganizationInput: $createOrganizationInput) {
        PK
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
  listWorkflowsOfAnOrg: `
    query ListWorkflowsOfAnOrg($listWorkflowsOfAnOrgInput: ListWorkflowsOfAnOrgInput!) {
      ListWorkflowsOfAnOrg(listWorkflowsOfAnOrgInput: $listWorkflowsOfAnOrgInput) {
        Workflows {
          PK
          SK
          WLFN
          DATA
        }
        TotalRecords
        Error
      }
    }
  `,
};

const WorkflowName = 'TestWorkflowName';

const createOrganizationInput: CreateOrganizationInput = {
  orgName: 'TestOrgName',
};

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
  OrgId: '',
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

const listWorkflowsOfAnOrgInput: ListWorkflowsOfAnOrgInput = {
  OrgId: '',
  page: 1,
  pageSize: 2,
};

describe('WorkflowResolver (e2e)', () => {
  const workflowKeysToDelete = [];
  const workflowVersionKeysToDelete = [];
  let orgId = '';

  beforeAll(async () => {
    await setUpTesting();
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('createWorkflow', () => {
    it('should create the organization', async () => {
      const data = await initiateGraphqlRequest(gql.CreateOrganization, { createOrganizationInput });
      orgId = data.CreateOrganization.PK;

      expect(data.CreateOrganization.PK).not.toBeUndefined();
    });

    it('should create the workflow', async () => {
      createWorkflowInput.OrgId = orgId;
      const data = await initiateGraphqlRequest(gql.createWorkflowMutation, { createWorkflowInput });

      expect(data.CreateWorkflow.WorkflowKeys).not.toBeUndefined();
      expect(data.CreateWorkflow.WorkflowVersionKeys).not.toBeUndefined();

      const WorkflowKeys = data.CreateWorkflow.WorkflowKeys;
      const WorkflowVersionkeys = data.CreateWorkflow.WorkflowVersionKeys;

      workflowKeysToDelete.push(WorkflowKeys);
      workflowVersionKeysToDelete.push(WorkflowVersionkeys);

      const workflow = await workflowService.getWorkflowByKey(WorkflowKeys);
      expect(workflow.WLFN).toEqual(createWorkflowInput.WorkflowName);

      const workflowVersion = await workflowVersionService.getWorkflowVersionByKey(WorkflowVersionkeys);
      expect(workflowVersion.WV).toEqual('1');

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
      expect(data.GetWorkflowByName).toEqual({
        PK: `${orgId}|WLF#1`,
        SK: 'WLF#1',
        WLFN: WorkflowName,
        DATA: `WLF#${WorkflowName}`,
      });
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

  describe('listWorkflowsOfAnOrg', () => {
    beforeAll(async () => {
      const {
        CreateOrganization: { PK },
      } = await initiateGraphqlRequest(gql.CreateOrganization, {
        createOrganizationInput: { orgName: 'TestOrgName2' },
      });
      await workflowRepository.createWorkflow({ WorkflowName: 'Workflow1', OrgId: PK, WorkflowNumber: 0 });
      await workflowRepository.createWorkflow({ WorkflowName: 'Workflow2', OrgId: PK, WorkflowNumber: 1 });
      await organizationService.saveOrganization({ PK }, { TotalWLF: 2 });
      listWorkflowsOfAnOrgInput.OrgId = PK;
    });

    it('should list workflows of an organization', async () => {
      const data = await initiateGraphqlRequest(gql.listWorkflowsOfAnOrg, { listWorkflowsOfAnOrgInput });

      expect(data.ListWorkflowsOfAnOrg.Workflows.length).toEqual(2);
      expect(data.ListWorkflowsOfAnOrg.TotalRecords).toEqual(2);
      expect(data.ListWorkflowsOfAnOrg.Workflows[0]).toEqual({
        PK: `${listWorkflowsOfAnOrgInput.OrgId}|WLF#1`,
        SK: 'WLF#1',
        WLFN: 'Workflow1',
        DATA: 'WLF#Workflow1',
      });
      expect(data.ListWorkflowsOfAnOrg.Workflows[1]).toEqual({
        PK: `${listWorkflowsOfAnOrgInput.OrgId}|WLF#2`,
        SK: 'WLF#2',
        WLFN: 'Workflow2',
        DATA: 'WLF#Workflow2',
      });
    });
  });
});
