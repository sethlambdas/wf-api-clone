import { Module } from '@nestjs/common';
import { DBEngineController } from './db-engine.controller';
import { DBEngineService } from './db-engine.service';

@Module({
  controllers: [DBEngineController],
  providers: [DBEngineService],
})
export class DBEngineModule {}
