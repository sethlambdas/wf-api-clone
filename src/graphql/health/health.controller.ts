import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { AppHealthIndicator } from './app.health';
import { ConfigUtil } from '../../utils/config.util';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService, private appHealthIndicator: AppHealthIndicator) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([async () => this.appHealthIndicator.isHealthy('application')]);
  }


  @Get('/check/emailIngestion')
  async checkEmailIngestionService() {
    const url = ConfigUtil.get('externalServices.imapEndpoint') + '/api/health';
    const res = await fetch(url);
    return await res.json();
  }
}
