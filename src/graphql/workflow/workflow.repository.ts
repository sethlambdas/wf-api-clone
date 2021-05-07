import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { v4 } from 'uuid';
import { ConfigUtil } from '../../utils/config.util';
import { GSI } from '../common/enums/gsi-names.enum';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';
import { CreateWorkflowInputRepository } from './inputs/create-workflow.input';
import { WorkflowModelRepository } from './workflow.entity';

@Injectable()
export class WorkflowRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowModel: Model<WorkflowModelRepository, WorkflowKeys>,
  ) {}

  async createWorkflow(createWorkflowInputRepository: CreateWorkflowInputRepository) {
    const { WLFN, OrgId } = createWorkflowInputRepository;

    const results = await this.workflowModel.create({
      PK: OrgId,
      SK: `WLF#${v4()}`,
      DATA: `WLF#${WLFN}`,
      WLFN,
    });
    return results;
  }

  async getWorkflowByKey(keys: { PK: string; SK: string }) {
    const results = await this.workflowModel.get(keys);
    return results;
  }

  async getWorkflowByName(name: string, orgId: string) {
    return this.workflowModel
      .query({ DATA: `WLF#${name}` })
      .and()
      .where('PK')
      .beginsWith(orgId)
      .using(GSI.DataOverloading)
      .exec();
  }
}
