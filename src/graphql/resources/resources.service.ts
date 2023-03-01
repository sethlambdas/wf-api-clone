import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateResourcesInput } from './inputs/create-resource.input';
import { Resources } from './resources.entity';
import { ResourcesRepository } from './resources.repository';

@Injectable()
export class ResourcesService {
  private logger = new Logger('ResourceService');
  constructor(
    @Inject(ResourcesRepository)
    private resourcesRepository: ResourcesRepository,
  ) {}
  async createResource(createResourcesInput: CreateResourcesInput): Promise<Resources | null> {
    const counts = await this.resourcesRepository.countResources();
    this.logger.log('counts resource ...', counts);
    const resources: Resources = {
      PK: `RES#${counts}||${createResourcesInput.name}`,
      ...createResourcesInput,
    };

    const result = await this.resourcesRepository.createResource(resources);
    return result;
  }

  async updateResource(primaryKey: string, createResourcesInput: CreateResourcesInput): Promise<Resources | null> {
    const counts = await this.resourcesRepository.countResources();
    this.logger.log('counts resource ...', counts);
    const resources: Partial<Resources> = {
      configuration: createResourcesInput.configuration,
      database: createResourcesInput.database,
      name: createResourcesInput.name
    };

    const result = await this.resourcesRepository.updateResource(primaryKey, resources);
    return result;
  }

  async getAllResources(): Promise<Resources[]> {
    const result = await this.resourcesRepository.getAllResources();
    return result;
  }

  async getResourceByPK(pk: string): Promise<Resources | null> {
    const result = await this.resourcesRepository.getResourceByPK(pk);
    return result;
  }
}
