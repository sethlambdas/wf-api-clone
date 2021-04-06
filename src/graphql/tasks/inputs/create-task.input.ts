import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class CreateTaskInput {
  @Field()
  @IsString()
  @MinLength(4)
  title: string;

  @Field()
  @IsString()
  @MinLength(8)
  description: string;
}
