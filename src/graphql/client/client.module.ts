import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientRepository } from './client.repository';

@Module({
  controllers: [ClientController],
  providers: [ClientRepository],
})
export class ClientModule {}
