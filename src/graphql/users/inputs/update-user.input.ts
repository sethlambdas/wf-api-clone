import { Field, InputType } from '@nestjs/graphql';
import { UserRoleEnum } from '../../common/enums/user-roles.enum';

@InputType()
export class UpdateUserInput {
  @Field()
  key: string;

  @Field((type) => UserRoleEnum, { nullable: true })
  role?: UserRoleEnum;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  orgId?: string;

  @Field({ nullable: true })
  orgName?: string;
}
