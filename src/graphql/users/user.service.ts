import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthenticationError } from 'apollo-server-express';
import { ConfigUtil } from '../../utils/config.util';
import { AuthCredentials } from './auth/auth-credentials.type';
import { SignInCredentialsInput } from './inputs/sign-in-credentials.input';
import { SignUpCredentialsInput } from './inputs/sign-up-credentials.input';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async getUserById(id: number): Promise<User> {
    return this.userRepository.getUserById(id);
  }

  async signUp(signUpCredentialsInput: SignUpCredentialsInput): Promise<User> {
    return this.userRepository.signUp(signUpCredentialsInput);
  }

  async signIn(signInCredentialsInput: SignInCredentialsInput): Promise<AuthCredentials> {
    const user = await this.userRepository.validateUserPassword(signInCredentialsInput);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload: User = user;
    const { accessToken, refreshTokenGenerate } = await this.generateToken(payload);
    this.logger.debug(`Generated JWT Token with payload ${JSON.stringify(payload)}`);
    return { accessToken, refreshTokenGenerate };
  }

  async signOut(context: any): Promise<boolean> {
    await this.clearCookie(context);
    return true;
  }

  async refreshToken(context: any): Promise<AuthCredentials> {
    const refreshToken = context.req.cookies.refreshToken;
    if (!refreshToken) {
      return;
    }
    try {
      const data = await this.jwtService.verify(refreshToken);
      if (!data || !data.id) {
        throw new Error();
      }
      const user = await User.findOne(data.id);
      if (!user) {
        throw new Error();
      }
      const { refreshTokenGenerate, accessToken } = await this.generateToken(user);
      await this.setCookie(context, { refreshTokenGenerate });
      return { accessToken };
    } catch {
      throw new AuthenticationError('Unauthorized Access');
    }
  }

  async generateToken(user: User): Promise<AuthCredentials> {
    const accessToken = await this.jwtService.sign({
      id: user.id,
      email: user.email,
    });
    const refreshTokenGenerate = await this.jwtService.sign(
      { id: user.id },
      { expiresIn: ConfigUtil.get('jwt.refreshToken.expiresIn') },
    );
    return { accessToken, refreshTokenGenerate };
  }

  async setCookie(context: any, token: AuthCredentials) {
    const { refreshTokenGenerate } = token;
    context.res.cookie('refreshToken', refreshTokenGenerate, {
      httpOnly: true,
      maxAge: ConfigUtil.get('jwt.refreshToken.maxAge'),
    });
  }

  async clearCookie(context: any) {
    context.res.clearCookie('refreshToken');
  }
}
