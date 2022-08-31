import { INestApplication, Logger } from '@nestjs/common';

import { EntityCountService } from '../graphql/entity-count/entitiy-count.service';

const logger = new Logger('SetupEntityCount');

export async function setupEntityCount(app: INestApplication) {
  logger.log('running initial entity-count setup');

  const entityCountService = app.get(EntityCountService);

  await entityCountService.createEntityCount();

  logger.log('entity-count setup - successful');

  return { success: true };
}
