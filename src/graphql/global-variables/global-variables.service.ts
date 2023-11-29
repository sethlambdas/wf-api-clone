import { Injectable } from '@nestjs/common';
import { GlobalVariableInput } from './dto/create-global-variable.input';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { ConfigUtil } from '@lambdascrew/utility';
import { GlobalVariable } from './entities/global-variable.entity';
import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';

@Injectable()
export class GlobalVariablesService {
  constructor(
    @InjectModel(ConfigUtil.get('dynamodb.schema.globalVariables'))
    private globalVariableModel: Model<GlobalVariable, SimplePrimaryKey>,
  ) {}
  async create(createGlobalVariableInput: GlobalVariableInput): Promise<GlobalVariable | null> {
    const globalVariable: GlobalVariable = await this.globalVariableModel.create(createGlobalVariableInput);
    return globalVariable;
  }

  async findAll(): Promise<GlobalVariable[] | []> {
    const globalVariables: GlobalVariable[] = await this.globalVariableModel.scan().all().exec();
    return globalVariables;
  }

  async findOne(PK: string): Promise<GlobalVariable | null> {
    const globalVariable = await this.globalVariableModel.get({ PK });
    return globalVariable;
  }

  async update(updateGlobalVariableInput: GlobalVariableInput): Promise<GlobalVariable | null> {
    const { PK, environmentValues } = updateGlobalVariableInput;
    const globalVariable = await this.globalVariableModel.get({ PK });
    if (globalVariable) {
      const updatedGlobalVariable: GlobalVariable = await this.globalVariableModel.update(
        { PK },
        {
          environmentValues,
        },
      );
      return updatedGlobalVariable;
    }
    return null;
  }

  async remove(key: SimplePrimaryKey): Promise<GlobalVariable | null> {
    const deletedGlobalVariable = await this.globalVariableModel.get(key);
    if (deletedGlobalVariable) {
      await this.globalVariableModel.delete(key);
      return deletedGlobalVariable;
    } else {
      throw new Error(`GlobalVariable with PK ${key.PK} not found`);
    }
  }
}
