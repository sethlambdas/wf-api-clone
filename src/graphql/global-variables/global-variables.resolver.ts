import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GlobalVariableInput } from './dto/create-global-variable.input';
import { GlobalVariable } from './entities/global-variable.entity';
import { GlobalVariablesService } from './global-variables.service';

@Resolver(() => GlobalVariable)
export class GlobalVariablesResolver {
  constructor(private readonly globalVariablesService: GlobalVariablesService) {}

  @Mutation(() => GlobalVariable)
  createGlobalVariable(@Args('createGlobalVariableInput') createGlobalVariableInput: GlobalVariableInput) {
    return this.globalVariablesService.create(createGlobalVariableInput);
  }

  @Query(() => [GlobalVariable], { name: 'findAllGlobalVariables' })
  findAllGlobalVariables() {
    return this.globalVariablesService.findAll();
  }

  @Query(() => GlobalVariable, { name: 'findGlobalVariableOfOrg' })
  findOne(@Args('PK', { type: () => String }) PK: string) {
    return this.globalVariablesService.findOne(PK);
  }

  @Mutation(() => GlobalVariable)
  updateGlobalVariable(@Args('updateGlobalVariableInput') updateGlobalVariableInput: GlobalVariableInput) {
    return this.globalVariablesService.update(updateGlobalVariableInput);
  }

  @Mutation(() => GlobalVariable)
  removeGlobalVariable(@Args('PK', { type: () => String }) PK: string) {
    return this.globalVariablesService.remove({ PK });
  }
}
