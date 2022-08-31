import { Inject, Injectable } from '@nestjs/common';

import { EntityCount } from './entitiy-count.entity';
import { EntityCountRepository } from './entity-count.repository';

@Injectable()
export class EntityCountService {
  constructor(
    @Inject(EntityCountRepository)
    private entityCountRepository: EntityCountRepository,
  ) {}

  async createEntityCount(): Promise<EntityCount> {
    const entityCount = await this.entityCountRepository.findEntityCount();

    if (entityCount) return entityCount;

    const result = await this.entityCountRepository.createEntityCount();
    return result;
  }

  async findEntityCount(): Promise<EntityCount> {
    const result = await this.entityCountRepository.findEntityCount();
    return result;
  }

  async saveEntityCount(entityCount: Partial<EntityCount>) {
    return this.entityCountRepository.saveEntityCount(entityCount);
  }
}
