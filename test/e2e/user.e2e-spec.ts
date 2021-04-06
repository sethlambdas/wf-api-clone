import * as faker from 'faker';
import * as request from 'supertest';
import { getHttpServerTesting, setUpTesting, tearDownTesting } from '../test-e2e';

const gql = {
  signUpMutation: `
    mutation SignUp($signUpCredentialsInput: SignUpCredentialsInput!) {
      SignUp(signUpCredentialsInput: $signUpCredentialsInput) {
        id
        email
      }
    }
  `,
  signInMutation: `
    mutation SignIn($signInCredentialsInput: SignInCredentialsInput!) {
      SignIn(signInCredentialsInput: $signInCredentialsInput) {
        accessToken
      }
    }
  `,
  refreshTokenQuery: `
    query {
      RefreshToken {
        accessToken
      }
    }
  `,
  signOutMutation: `
    query {
      SignOut
    }
  `,
};

const authCredentialsInput = {
  email: faker.internet.email(),
  password: faker.internet.password(10),
};

let agent: request.SuperAgentTest;

describe('UserResolver (e2e)', () => {
  beforeAll(async () => {
    await setUpTesting();
    agent = request.agent(getHttpServerTesting());
  });

  afterAll(async () => {
    await tearDownTesting();
  });

  describe('signUp', () => {
    it('should sign up the user', () => {
      return request(getHttpServerTesting())
        .post('/api/graphql')
        .send({
          query: gql.signUpMutation,
          variables: {
            signUpCredentialsInput: authCredentialsInput,
          },
        })
        .expect(({ body: { data } }) => {
          const signUp = data.SignUp;
          expect(signUp.id).toBe(1);
          expect(signUp.email).toBe(authCredentialsInput.email);
        })
        .expect(200);
    });
  });

  describe('signIn', () => {
    it('should sign in the user', () => {
      return agent
        .post('/api/graphql')
        .send({
          query: gql.signInMutation,
          variables: {
            signInCredentialsInput: authCredentialsInput,
          },
        })
        .expect(({ body: { data } }) => {
          const signIn = data.SignIn;
          expect(signIn.accessToken).not.toBeNull();
        })
        .expect(200);
    });
  });

  describe('refreshToken', () => {
    it('should get the refresh access token', () => {
      return agent
        .post('/api/graphql')
        .send({
          query: gql.refreshTokenQuery,
        })
        .expect(({ body: { data } }) => {
          const refreshToken = data.RefreshToken;
          expect(refreshToken.accessToken).not.toBeNull();
        })
        .expect(200);
    });
  });

  describe('signOut', () => {
    it('should sign out the user', () => {
      return agent
        .post('/api/graphql')
        .send({
          query: gql.signOutMutation,
        })
        .expect(({ body: { data } }) => {
          const signOut = data.SignOut;
          expect(signOut).toBe(true);
        })
        .expect(200);
    });
  });
});
