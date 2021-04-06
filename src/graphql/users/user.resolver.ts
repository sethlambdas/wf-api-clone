import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthCredentials } from './auth/auth-credentials.type';
import { SignInCredentialsInput } from './inputs/sign-in-credentials.input';
import { SignUpCredentialsInput } from './inputs/sign-up-credentials.input';
import { User } from './user.entity';
import { UserService } from './user.service';

@UsePipes(ValidationPipe)
@Resolver((of) => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Mutation((returns) => User)
  async SignUp(
    @Args('signUpCredentialsInput')
    signUpCredentialsInput: SignUpCredentialsInput,
  ) {
    return this.userService.signUp(signUpCredentialsInput);
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

  @Query((returns) => Boolean)
  async SignOut(@Context() context) {
    return this.userService.signOut(context);
  }

  @Query((returns) => AuthCredentials, { nullable: true })
  async RefreshToken(@Context() context) {
    return this.userService.refreshToken(context);
  }
}
