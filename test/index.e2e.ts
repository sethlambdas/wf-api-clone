import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

import { ConfigUtil } from '@lambdascrew/utility';

import { AppModule } from "../src/graphql/app.module"
import { OrganizationService } from '../src/graphql/organizations/organization.service';
import { WorkflowStepService } from '../src/graphql/workflow-steps/workflow-step.service';
import { WorkflowVersionService } from '../src/graphql/workflow-versions/workflow-version.service';
import { WorkflowRepository } from '../src/graphql/workflow/workflow.repository';
import { WorkflowService } from '../src/graphql/workflow/workflow.service';
import { ClientTokenService } from '../src/graphql/client-token/client-token.service';

let app: INestApplication;

export let workflowStepService: WorkflowStepService;
export let workflowVersionService: WorkflowVersionService;
export let workflowService: WorkflowService;
export let workflowRepository: WorkflowRepository;
export let organizationService: OrganizationService;
export let clientTokenService: ClientTokenService

export const setUpTesting = async () => {
    const module: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();
    app = module.createNestApplication();

    app.setGlobalPrefix(ConfigUtil.get('server.prefix'));

    app.use(cookieParser());

    workflowStepService = await module.get(WorkflowStepService);
    workflowVersionService = await module.get(WorkflowVersionService);
    workflowService = await module.get(WorkflowService);
    workflowRepository = await module.get(WorkflowRepository);
    organizationService = await module.get(OrganizationService);
    clientTokenService = await module.get(ClientTokenService);

    await app.init();
};

export const tearDownTesting = async () => {
    await app.close();
};

export const getHttpServerTesting = () => {
    return app.getHttpServer();
};

export const authBearerToken = (accessToken) => {
    return `Bearer ${accessToken}`;
};

export const initiateGraphqlRequest = async (query: any, variables: any) => {
    const {
        body: { data },
    } = await request(getHttpServerTesting()).post('/api/graphql').send({ query, variables }).expect(200);

    return data;
};
