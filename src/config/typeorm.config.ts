import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { ConfigUtil } from '@lambdascrew/utility';

const typeOrmConfig: TypeOrmModuleOptions = {
  type: ConfigUtil.get('db.type'),
  host: ConfigUtil.get('db.host'),
  port: ConfigUtil.get('db.port'),
  username: ConfigUtil.get('db.username'),
  password: ConfigUtil.get('db.password'),
  database: ConfigUtil.get('db.database'),
  logging: ConfigUtil.get('db.logging'),
  entities: [`${__dirname}/../**/*.entity.{js,ts}`],
  migrations: [`${__dirname}/../migrations/**/*.{js,ts}`],
  synchronize: ConfigUtil.get('db.synchronize'),
};

export = typeOrmConfig;
