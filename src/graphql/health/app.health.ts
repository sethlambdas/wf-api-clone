import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class AppHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = true;
    const result = this.getStatus(key, isHealthy, {
      state: 'running',
      status: 'healthy',
      application: 'workflow-api'
    });

    if (isHealthy) {
      return result;
    }
  }
}
