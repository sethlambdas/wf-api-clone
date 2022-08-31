import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { v4 } from 'uuid';

import { ConfigUtil } from '@lambdascrew/utility';

import { SimplePrimaryKey } from '@graphql:common/interfaces/dynamodb-keys.interface';
import { CreateOrganizationInput } from './inputs/create-organization.input';
import { Organization } from './organization.entity';

@Injectable()
export class OrganizationRepository {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.authOrganizations'))
    private organizationModel: Model<Organization, SimplePrimaryKey>,
  ) {}

  async createOrganization(createOrganizationInput: CreateOrganizationInput) {
    const { ORGNAME, ORGID } = createOrganizationInput;
    const orgId = ORGID || v4();
    const results = await this.organizationModel.create({
      PK: `ORG#${orgId}`,
      ORGNAME,
      TotalWLFBatches: 1,
      TotalUSR: 0,
    });

    return results;
  }

  async saveOrganization(simplePrimaryKey: SimplePrimaryKey, organization: Partial<Organization>) {
    return this.organizationModel.update(simplePrimaryKey, organization);
  }

  async getOrganization(simplePrimaryKey: SimplePrimaryKey) {
    return this.organizationModel.get(simplePrimaryKey);
  }
}
