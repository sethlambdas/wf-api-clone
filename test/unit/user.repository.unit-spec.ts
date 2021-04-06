import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as faker from 'faker';
import { UserRepository } from '../../src/graphql/users/user.repository';

let userRepository: UserRepository;

describe('UserRepository (unit)', () => {
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();

    userRepository = await module.get(UserRepository);
  });

  describe('hashPassword', () => {
    it('should calls bcrypt.hash to generate a hash', async () => {
      bcrypt.hash = jest.fn().mockResolvedValue('testHash');
      const password = faker.internet.password(10);
      const result = await userRepository.hashPassword(password, 'testSalt');
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 'testSalt');
      expect(result).toEqual('testHash');
    });
  });
});
