import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { IsPassword } from '../../common/validators/is-password.validator';

@InputType()
export class SignUpCredentialsInput {
  @Field()
  @IsEmail(undefined, {
    message: 'Email must be valid',
  })
  @IsNotEmpty()
  email: string;

  @Field()
  @MinLength(8)
  @IsPassword()
  @IsNotEmpty()
  password: string;
}
