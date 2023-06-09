import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';

import { ConfigUtil } from '@lambdascrew/utility';

import { CompositePrimaryKeyInput } from '../common/inputs/workflow-key.input';
import { CompositePrimaryKey } from '../common/interfaces/workflow-key.interface';

import {
  ListWorkflowExecutionsOfAnOrganizationInput,
  ListWorkflowExecutionsOfAVersionInput
} from './inputs/get.inputs';
import { WorkflowExecution } from './workflow-execution.entity';
import { PrefixWorkflowExecutionKeys } from './workflow-execution.enum';

@Injectable()
export class WorkflowExecutionRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflowExecutions'))
    private workflowExecutionModel: Model<WorkflowExecution, CompositePrimaryKey>,
  ) {}

  async createWorkflowExecution(workflowExecution: WorkflowExecution) {
    return this.workflowExecutionModel.create(workflowExecution);
  }

  async saveWorkflowExecution(key: CompositePrimaryKeyInput, workflowExecution: Partial<WorkflowExecution>) {
    return this.workflowExecutionModel.update(key, workflowExecution);
  }

  async deleteWorkflowExecution(key: CompositePrimaryKeyInput) {
    return this.workflowExecutionModel.delete(key);
  }

  async getWorkflowExecutionByKey(key: CompositePrimaryKeyInput) {
    return this.workflowExecutionModel.get(key);
  }

  async listWorkflowExecutionsOfAnOrganization(
    listWorkflowExecutionsOfAnOrganizationInput: ListWorkflowExecutionsOfAnOrganizationInput,
  ) {
    const { OrgId, filter } = listWorkflowExecutionsOfAnOrganizationInput;
    const allWorkflowExecutions = [];
    const resultsPKSK = await this.workflowExecutionModel.scan().where('SK').beginsWith(`WSXH|${OrgId}`).exec();
    for (let i = 0; i < resultsPKSK.length; i++) {
      const splitString = resultsPKSK[i].PK.split('|');
      const resultSK = await this.workflowExecutionModel
        .query({ PK: resultsPKSK[i].PK })
        .and()
        .where('SK')
        .beginsWith(splitString[1])
        .exec();
      if (resultSK[0]) {
        if (!filter && !filter?.startDate && !filter?.endDate) {
          // Get all the executions
          allWorkflowExecutions.push(resultSK[0]);
        } else {
          // Get the filtered month's start and end dates
          const startOfMonth = new Date(filter.startDate);
          const endOfMonth = new Date(filter.endDate);

          const resultDate = new Date(resultSK[0].created_at);
          if (resultDate >= startOfMonth && resultDate <= endOfMonth) {
            allWorkflowExecutions.push(resultSK[0]);
          }
        }
      }
    }
    return Array.from(new Set(allWorkflowExecutions.map((obj) => JSON.stringify(obj)))).map((str) => JSON.parse(str));
  }

  async listWorkflowExecutionsOfAVersion(listWorkflowExecutionsOfAVersionInput: ListWorkflowExecutionsOfAVersionInput) {
    const { workflowVersionSK, TotalEXC, page, pageSize, order } = listWorkflowExecutionsOfAVersionInput;

    let results: any;
    const readItems = [];
    let wlfExecNumber = 0;
    let index = 1;

    if (order === 'asc') {
      wlfExecNumber = pageSize * page - pageSize + 1;
      while (index <= pageSize && wlfExecNumber <= TotalEXC) {
        readItems.push({
          PK: this.formWorkflowExecutionTablePK(workflowVersionSK, wlfExecNumber),
          SK: this.formWorkflowExecutionTableSK(wlfExecNumber),
        });

        ++wlfExecNumber;
        ++index;
      }
    } else {
      const totalPages = page * pageSize;
      const totalExcPages = TotalEXC - totalPages;
      wlfExecNumber = totalExcPages + pageSize;
      while (index <= pageSize && wlfExecNumber >= 0) {
        readItems.push({
          PK: this.formWorkflowExecutionTablePK(workflowVersionSK, wlfExecNumber),
          SK: this.formWorkflowExecutionTableSK(wlfExecNumber),
        });

        --wlfExecNumber;
        ++index;
      }
    }

    if (readItems.length > 0) results = await this.runBatchGetItems(readItems);

    if (results) return results;
    else return [];
  }

  async runBatchGetItems(readItems: any) {
    const response1 = await this.workflowExecutionModel.batchGet(readItems);
    if (response1.unprocessedKeys.length > 0) {
      const response2 = await this.runBatchGetItems(response1.unprocessedKeys);
      return [...response1, ...response2];
    }
    return [...response1];
  }

  formWorkflowExecutionTablePK(workflowVersionSK: string, execNum: number) {
    return `${workflowVersionSK}|${PrefixWorkflowExecutionKeys.SK}#${execNum}`;
  }

  formWorkflowExecutionTableSK(execNum: number) {
    return `${PrefixWorkflowExecutionKeys.SK}#${execNum}`;
  }
}
