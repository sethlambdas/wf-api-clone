import { Body, Controller, Param, Post } from '@nestjs/common';

import { Client } from './client.entity';
import { ClientRepository } from './client.repository';

@Controller('client')
export class ClientController {
  constructor(private clientRepository: ClientRepository) {}

  @Post('list')
  trigger(@Param() params: string[], @Body() payload: any): Promise<Client[]> {
    return this.clientRepository.listClients(payload);
  }
}