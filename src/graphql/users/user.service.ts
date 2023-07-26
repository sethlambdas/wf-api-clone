import { ConflictException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { ConfigUtil } from '@lambdascrew/utility';

import { JwtService } from '@nestjs/jwt';
import { EmailUtil } from '../../utils/email.util';
import { OrganizationService } from '../organizations/organization.service';
import { AuthCredentials, RefreshTokenResult } from './auth/auth-credentials.type';
import { ForgotPasswordInput } from './inputs/forgot-password.input';
import { ResetPasswordInput } from './inputs/reset-password.input';
import { SignInCredentialsInput } from './inputs/sign-in-credentials.input';
import { SignUpCredentialsInput } from './inputs/sign-up-credentials.input';
import { InviteUserInput } from './inputs/invite-user.input';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { GraphQLError } from 'graphql';
import { SimplePrimaryKey } from '../common/interfaces/dynamodb-keys.interface';
import { Organization } from '../../graphql/organizations/organization.entity';
import { UserRoleEnum } from '../common/enums/user-roles.enum';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(UserRepository)
    private userRepository: UserRepository,
    private organizationService: OrganizationService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpCredentialsInput: SignUpCredentialsInput) {
    const { name, username, email, password, orgName, orgId: organizationId } = signUpCredentialsInput;

    const getUser = await this.userRepository.getUserByEmail(email);
    // by default it is admin or either guest
    let userRole = UserRoleEnum.ADMINISTRATOR;
    if (getUser) {
      throw new ConflictException('Email already exists.');
    }

    let organization: Organization;

    if (organizationId) {
      organization = await this.organizationService.getOrganization({ PK: organizationId });
      userRole = UserRoleEnum.MODERATOR;
      if (!organization) {
        organization = await this.organizationService.createOrganization({
          ORGNAME: orgName,
        });
        userRole = UserRoleEnum.ADMINISTRATOR;
      }
    } else {
      organization = await this.organizationService.createOrganization({
        ORGNAME: orgName,
      });
    }

    const orgId = organization.PK;

    const salt = await bcrypt.genSalt();

    const user = {
      PK: `${orgId}|USER#${organization.TotalUSR + 1}`,
      name,
      username,
      email,
      password: await this.hashPassword(password, salt),
      salt,
      role: userRole,
    } as User;

    const createdUser = await this.userRepository.createUser(user);

    await this.organizationService.saveOrganization({
      PK: orgId,
      TotalUSR: organization.TotalUSR + 1,
      ORGNAME: orgName,
    });

    const { accessToken, refreshTokenGenerate } = await this.generateToken(createdUser);
    this.logger.debug(`Generated JWT Token with payload ${JSON.stringify(createdUser)}`);
    return { accessToken, refreshTokenGenerate };
  }

  async signIn(signInCredentialsInput: SignInCredentialsInput): Promise<AuthCredentials> {
    this.logger.log('signIn - validateUserPassword');
    const user = await this.validateUserPassword(signInCredentialsInput);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload: User = user;
    this.logger.log('signIn - generateToken');
    const { accessToken, refreshTokenGenerate } = await this.generateToken(payload);
    this.logger.debug(`Generated JWT Token with payload ${JSON.stringify(payload)}`);
    return { accessToken, refreshTokenGenerate };
  }

  async saveUser(key: SimplePrimaryKey, user: Partial<User>): Promise<any> {
    const updatedUser = await this.userRepository.saveUser(key, user);
    return updatedUser;
  }

  async getUserByKey(key: SimplePrimaryKey): Promise<User> {
    const user = await this.userRepository.getUserByKey(key);
    return user;
  }

  async getAllUsersOfOrg(orgId: string): Promise<User[]> {
    const users = await this.userRepository.getAllUsersOfOrg();
    const filteredUsers = users.filter((user) => user.PK.includes(orgId));
    return filteredUsers;
  }

  async signOut(context: any): Promise<boolean> {
    await this.clearCookie(context);
    return true;
  }

  async refreshToken(context: any, refreshTokenString: string): Promise<RefreshTokenResult> {
    const refreshToken = refreshTokenString || context.req.cookies.refreshToken;
    if (!refreshToken) {
      return;
    }
    try {
      const data = await this.jwtService.verify(refreshToken);
      if (!data || !data.PK) {
        throw new Error();
      }
      const user = await this.userRepository.getUserByKey({
        PK: data.PK,
      });
      if (!user) {
        throw new Error();
      }
      const { refreshTokenGenerate, accessToken } = await this.generateToken(user);
      const cookieOptions = await this.setCookie(context, { refreshTokenGenerate });
      return { accessToken, refreshTokenGenerate, cookieOptions, orgId: user.PK.split('|')[0] };
    } catch {
      throw new GraphQLError('Unauthorized Access');
    }
  }

  async generateToken(user: User): Promise<AuthCredentials> {
    const signedData = {
      PK: user.PK,
      email: user.email,
    };
    const accessToken = await this.jwtService.sign(signedData);
    const refreshTokenGenerate = await this.jwtService.sign(signedData, {
      expiresIn: ConfigUtil.get('jwt.refreshToken.expiresIn'),
    });
    return { accessToken, refreshTokenGenerate };
  }

  async setCookie(context: any, token: AuthCredentials) {
    const { refreshTokenGenerate } = token;
    const cookieOptions = {
      httpOnly: true,
      maxAge: ConfigUtil.get('jwt.refreshToken.maxAge'),
      sameSite: ConfigUtil.get('jwt.refreshToken.sameSite'),
      secure: true,
    };
    context.res.cookie('refreshToken', refreshTokenGenerate, cookieOptions);
    return cookieOptions;
  }

  async clearCookie(context: any) {
    context.res.clearCookie('refreshToken');
  }

  async forgotPassword(forgotPasswordInput: ForgotPasswordInput) {
    const { email, origin } = forgotPasswordInput;
    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      return false;
    }
    const emailTokenGenerated = await this.jwtService.sign(
      {
        PK: user.PK,
        email: user.email,
      },
      { expiresIn: ConfigUtil.get('jwt.emailToken.expiresIn') },
    );
    const urlOrigin = origin || ConfigUtil.get('server.origin');
    const url = `${urlOrigin}/auth/reset-password/?token=${emailTokenGenerated}`;
    EmailUtil.sendEmail(user.email, 'Reset Your Password', await this.forgotPasswordEmail(user, url));
    return emailTokenGenerated;
  }

  async resetPassword(resetPasswordInput: ResetPasswordInput) {
    const { password, token } = resetPasswordInput;
    const data = await this.jwtService.verify(token);
    if (!data || !data.PK) {
      throw new Error();
    }
    const user = await this.userRepository.getUserByKey({
      PK: data.PK,
    });
    if (!user) {
      throw new Error();
    }
    await this.userRepository.saveUser(
      {
        PK: user.PK,
      },
      {
        password: await this.hashPassword(password, user.salt),
      },
    );
    return true;
  }

  async inviteUserToOrganization(inviteUserInput: InviteUserInput) {
    const { email, orgId } = inviteUserInput;
    const urlOrigin = ConfigUtil.get('server.origin');
    const url = `${urlOrigin}/auth/sign-up?orgId=${encodeURIComponent(orgId)}`;
    EmailUtil.sendEmail(email, 'Workflow Invitation', await this.inviteUserEmail(url));
    return email;
  }

  private async inviteUserEmail(url: string) {
    return `
      Hi there,<br /><br />
      You have been invited to a Workflow Organization.<br /><br />
      To accept invitation, click on the URL below and signup:<br />
      <a href="${url}">${url}</a>
    `;
  }

  async forgotPasswordEmail(user: User, url: string) {
    return `
      Hi ${user.name},<br /><br />
      Forgot your password?<br />
      We received a request to reset the password for your account.<br /><br />
      To reset your password, click on the URL below:<br />
      <a href="${url}">${url}</a>
    `;
  }

  async validateUserPassword(signInCredentialsInput: SignInCredentialsInput): Promise<User> {
    const { email, password } = signInCredentialsInput;
    this.logger.log('validateUserPassword - getUserByEmail');
    const user = await this.userRepository.getUserByEmail(email);
    this.logger.log('validateUserPassword - validatePassword');
    if (user && (await this.validatePassword(password, user))) {
      return user;
    }
    return null;
  }

  async validatePassword(password: string, user: User): Promise<boolean> {
    const hash = await bcrypt.hash(password, user.salt);
    return hash === user.password;
  }

  async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
