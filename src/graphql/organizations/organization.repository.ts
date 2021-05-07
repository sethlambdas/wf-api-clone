import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { v4 } from 'uuid';
import { ConfigUtil } from '../../utils/config.util';
import { WorkflowKeys } from '../common/interfaces/workflow-key.interface';
import { CreateOrganizationInput } from './inputs/create-organization.input';
import { Organization } from './organization.entity';

@Injectable()
export class OrganizationRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflow'))
    private organzationModel: Model<Organization, WorkflowKeys>,
  ) {}

  async createOrganization(createOrganizationInput: CreateOrganizationInput) {
    const { orgName } = createOrganizationInput;
    const orgId = v4();
    const results = await this.organzationModel.create({
      PK: `ORG#${orgId}`,
      SK: `#MD#${orgId}`,
      ORGNAME: orgName,
    });

    return results;
  }
}
