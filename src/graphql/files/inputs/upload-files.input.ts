import { Field, InputType } from '@nestjs/graphql';
import { GraphQLUpload } from 'apollo-server-express';
import { File } from '../file.entity';

@InputType()
export class UploadFilesInput {
  @Field((type) => [GraphQLUpload])
  files: File[];
}
