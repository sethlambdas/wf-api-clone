import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { EntityRepository, Repository } from 'typeorm';
import { SignInCredentialsInput } from './inputs/sign-in-credentials.input';
import { SignUpCredentialsInput } from './inputs/sign-up-credentials.input';
import { User } from './user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async getUserById(id: number): Promise<User> {
    const user = await this.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async signUp(signUpCredentialsInput: SignUpCredentialsInput): Promise<User> {
    const { email, password } = signUpCredentialsInput;

    const user = this.create();
    user.email = email;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      return await user.save();
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUserPassword(signInCredentialsInput: SignInCredentialsInput): Promise<User> {
    const { email, password } = signInCredentialsInput;
    const user = await this.findOne({ email });
    if (user && (await user.validatePassword(password))) {
      return user;
    }
    return null;
  }

  async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
