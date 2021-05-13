import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { v4 } from 'uuid';
import { ConfigUtil } from '../../utils/config.util';
import { SimplePrimaryKey } from '../common/interfaces/workflow-key.interface';
import { CreateOrganizationInput } from './inputs/create-organization.input';
import { Organization } from './organization.entity';

@Injectable()
export class OrganizationRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.workflowOrganization'))
    private organzationModel: Model<Organization, SimplePrimaryKey>,
  ) {}

  async createOrganization(createOrganizationInput: CreateOrganizationInput) {
    const { orgName, orgId: id } = createOrganizationInput;
    const orgId = id || v4();
    const results = await this.organzationModel.create({
      PK: `ORG#${orgId}`,
      ORGNAME: orgName,
      TotalWLF: 0,
      TotalUSR: 0,
    });

    return results;
  }

  async saveOrganization(simplePrimaryKey: SimplePrimaryKey, organization: Organization) {
    return this.organzationModel.update(simplePrimaryKey, organization);
  }

  async getOrganization(simplePrimaryKey: SimplePrimaryKey) {
    return this.organzationModel.get(simplePrimaryKey);
  }
}
