import { Body, Controller, Param, Post } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';

@Controller('organization')
export class OrganizationController {
  constructor(private organizationRepository: OrganizationRepository) {}
}
