import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class ListIntegrationAppRecordsInput {
  @Field((type) => Int, { defaultValue: 1 })
  page: number;

  @Field((type) => Int, { defaultValue: 100 })
  pageSize: number;
}

export interface ListIntegrationAppRecordsRepoInput extends ListIntegrationAppRecordsInput {
  totalIntApp: number;
}

export class ListIntegrationAppsInput {
  page: number;
}
