import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '@lambdascrew/utility';

import { getPaginatedData } from '../../utils/helpers/array-helpers.util';
import { GSI } from '../common/enums/gsi-names.enum';
import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';

import { ListAllWorkflowVersionsOfWorkflowInput } from './inputs/get.inputs';
import { WorkflowVersion } from './workflow-version.entity';
import { PrefixWorkflowVersionKeys } from './workflow-version.enum';

@Injectable()
export class WorkflowVersionRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflowVersions'))
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
    const { WorkflowPK, WorkflowName, page, pageSize, sortBy, sortDir } = listAllWorkflowVersionsOfWorkflowInput;

    const workflowVersions = await this.workflowVersionModel
      .query({ PK: this.formWorkflowVersionsTablePK(WorkflowPK, WorkflowName) })
      .and()
      .where('SK')
      .beginsWith(`${PrefixWorkflowVersionKeys.SK}#`)
      .exec();

    const paginatedWorkflowVersions = getPaginatedData(workflowVersions, sortBy, sortDir, page, pageSize);

    return {
      workflowVersions: paginatedWorkflowVersions,
      TotalRecords: workflowVersions.length,
    };
  }

  async deleteWorkflowVersion(key: CompositePrimaryKeyInput) {
    return this.workflowVersionModel.delete(key);
  }

  async getWorkflowVersionByKey(key: CompositePrimaryKeyInput) {
    return this.workflowVersionModel.get(key);
  }

  async getWorkflowVersionBySK(key: CompositePrimaryKeyInput) {
    const { PK, SK } = key;
    return this.workflowVersionModel
      .query({ DATA: SK })
      .and()
      .where('PK')
      .beginsWith(PK)
      .using(GSI.DataOverloading)
      .exec();
  }
  
  formWorkflowVersionsTablePK(workflowPK: string, workflowName: string) {
    return `${workflowPK}||WLF#${workflowName}`;
  }

  formWorkflowVersionsTableSK(id: string) {
    return `${PrefixWorkflowVersionKeys.SK}#${id}`;
  }
}
