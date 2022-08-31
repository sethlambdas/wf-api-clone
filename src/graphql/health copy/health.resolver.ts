import { Query, Resolver } from '@nestjs/graphql';
import { HealthCheck } from './health.entity';

@Resolver((of) => HealthCheck)
export class HealthResolver {
  @Query((returns) => HealthCheck)
  async HealthCheckGraphql() {
    return {
      app: 'authentication-be',
      status: 'healthy',
      state: 'running',
    };
  }
}
