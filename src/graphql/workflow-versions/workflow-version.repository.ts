import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '../../utils/config.util';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { ListAllWorkflowVersionsOfWorkflowInput } from './inputs/read-queries.inputs';
import { WorkflowVersion } from './workflow-version.entity';

@Injectable()
export class WorkflowVersionRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private workflowVersionModel: Model<WorkflowVersion, CompositePrimaryKey>,
  ) {}

  async createWorkflowVersion(workflowVersion: WorkflowVersion) {
    return this.workflowVersionModel.create(workflowVersion);
  }

  async saveWorkflowVersion(key: CompositePrimaryKeyInput, workflowVersion: Partial<WorkflowVersion>) {
    return this.workflowVersionModel.update(key, workflowVersion);
  }

  async listAllWorkflowVersionsOfWorkflow(
    listAllWorkflowVersionsOfWorkflowInput: ListAllWorkflowVersionsOfWorkflowInput,
  ) {
    const { WorkflowPK, LastKey, page, pageSize } = listAllWorkflowVersionsOfWorkflowInput;

    let workflowVersions: any;

    const query = this.workflowVersionModel.query({ PK: WorkflowPK }).and().where('SK').beginsWith(`WV#`);

    const { count } = await this.workflowVersionModel
      .query({ PK: WorkflowPK })
      .and()
      .where('SK')
      .beginsWith(`WV#`)
      .count()
      .all()
      .exec();

    if (pageSize) query.limit(pageSize);

    if (LastKey) {
      const startAtKey = JSON.parse(LastKey);
      query.startAt(startAtKey);
      workflowVersions = await query.exec();
    } else if (page) {
      let lastEvaluatedKey: any = null;
      for (let i = 0; i < page; i++) {
        if (lastEvaluatedKey) query.startAt(lastEvaluatedKey);
        workflowVersions = await query.exec();
        lastEvaluatedKey = workflowVersions.lastKey;
      }
    }

    return {
      workflowVersions,
      TotalRecords: count,
    };
  }

  async deleteWorkflowVersion(key: CompositePrimaryKeyInput) {
    return this.workflowVersionModel.delete(key);
  }

  async getWorkflowVersionByKey(key: CompositePrimaryKeyInput) {
    return this.workflowVersionModel.get(key);
  }
}
