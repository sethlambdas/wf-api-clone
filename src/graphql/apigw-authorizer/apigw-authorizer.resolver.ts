import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { ApigwAuthorizer } from './apigw-authorizer.entity';
import { ApigwAuthorizerService } from './apigw-authorizer.service';
import { CreateApigwAuthorizerInput } from './inputs/create-apigw-authorizer.input';
import { FindApigwAuthorizerByPkInput } from './inputs/find-apigw-authorizer.input';

@Resolver((of) => ApigwAuthorizer)
export class ApigwAuthorizerResolver {
  constructor(private apigwAuthorizerService: ApigwAuthorizerService) {}

  @Query((returns) => ApigwAuthorizer, { nullable: true })
  async FindApigwAuthorizerByPK(
    @Args('findApigwAuthorizerByPkInput') findApigwAuthorizerByPkInput: FindApigwAuthorizerByPkInput,
  ): Promise<ApigwAuthorizer | null> {
    return this.apigwAuthorizerService.findApigwAuthorizerByPK(findApigwAuthorizerByPkInput);
  }

  @Mutation((returns) => ApigwAuthorizer, { nullable: true })
  async CreateApigwAuthorizer(
    @Args('createApigwAuthorizerInput') createApigwAuthorizerInput: CreateApigwAuthorizerInput,
  ): Promise<ApigwAuthorizer | null> {
    return this.apigwAuthorizerService.createApigwAuthorizer(createApigwAuthorizerInput);
  }
}
