import { Logger } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthCredentials, RefreshTokenResult } from './auth/auth-credentials.type';
import { ForgotPasswordInput } from './inputs/forgot-password.input';
import { InviteUserInput } from './inputs/invite-user.input';
import { ResetPasswordInput } from './inputs/reset-password.input';
import { SignInCredentialsInput } from './inputs/sign-in-credentials.input';
import { SignUpCredentialsInput } from './inputs/sign-up-credentials.input';
import { UpdateUserInput } from './inputs/update-user.input';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Resolver((of) => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Mutation((returns) => AuthCredentials)
  async SignUp(
    @Context() context,
    @Args('signUpCredentialsInput')
    signUpCredentialsInput: SignUpCredentialsInput,
  ) {
    const token = await this.userService.signUp(signUpCredentialsInput);
    await this.userService.setCookie(context, token);
    return token;
  }

  @Mutation((returns) => AuthCredentials)
  async SignIn(
    @Context() context,
    @Args('signInCredentialsInput')
    signInCredentialsInput: SignInCredentialsInput,
  ) {
    const token = await this.userService.signIn(signInCredentialsInput);
    await this.userService.setCookie(context, token);
    return token;
  }

  @Mutation((returns) => User)
  async UpdateUserRole(
    @Args('updateUserInput')
    updateUserInput: UpdateUserInput,
  ) {
    const { key, role } = updateUserInput;
    const user = await this.userService.saveUser({ PK: key }, { role });
    return user;
  }

  @Query((returns) => Boolean)
  async SignOut(@Context() context) {
    return this.userService.signOut(context);
  }

  @Mutation((returns) => String)
  async ForgotPassword(@Args('forgotPasswordInput') forgotPasswordInput: ForgotPasswordInput) {
    return this.userService.forgotPassword(forgotPasswordInput);
  }

  @Mutation((returns) => String)
  async InviteUserToOrganization(@Args('inviteUserInput') inviteUserInput: InviteUserInput) {
    return this.userService.inviteUserToOrganization(inviteUserInput);
  }

  @Mutation((returns) => Boolean)
  async ResetPassword(@Args('resetPasswordInput') resetPasswordInput: ResetPasswordInput) {
    return this.userService.resetPassword(resetPasswordInput);
  }

  @Query((returns) => RefreshTokenResult, { nullable: true })
  async RefreshToken(
    @Context() context,
    @Args('refreshToken', { nullable: true })
    refreshToken: string,
  ) {
    return this.userService.refreshToken(context, refreshToken);
  }

  @Query((returns) => [User], { nullable: true })
  async GetAllUsersOfOrganization(@Args('orgId') orgId: string): Promise<User[]> {
    return this.userService.getAllUsersOfOrg(orgId);
  }
}
