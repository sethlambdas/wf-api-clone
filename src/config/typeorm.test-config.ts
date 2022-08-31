import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { ConfigUtil } from '@lambdascrew/utility';

import * as typeOrmConfig from './typeorm.config';

const typeOrmTestConfig: TypeOrmModuleOptions = {
  ...typeOrmConfig,
  dropSchema: ConfigUtil.get('db.dropSchema') || false,
  migrationsRun: ConfigUtil.get('db.migrationsRun') || false,
};

export = typeOrmTestConfig;
