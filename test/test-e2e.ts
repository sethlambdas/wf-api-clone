import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as cookieParser from 'cookie-parser';
import * as faker from 'faker';
import * as typeOrmTestConfig from './../src/config/typeorm.test-config';
import { AppModule } from './../src/graphql/app.module';
import { UserService } from './../src/graphql/users/user.service';
import { ConfigUtil } from './../src/utils/config.util';
// import * as dynamoose from 'dynamoose';

let app: INestApplication;
let userService: UserService;

export const setUpTesting = async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule, TypeOrmModule.forRoot(typeOrmTestConfig)],
  }).compile();
  app = module.createNestApplication();

  app.setGlobalPrefix(ConfigUtil.get('server.prefix'));

  app.use(cookieParser());

  userService = await module.get(UserService);

  await app.init();
};

export const tearDownTesting = async () => {
  await app.close();
};

export const getHttpServerTesting = () => {
  return app.getHttpServer();
};

export const removeDynamoTable = async (TableName: string) => {
  // dynamoose.aws.ddb.local(ConfigUtil.get('dynamodb.local'));
  // const ddb = new dynamoose.aws.sdk.DynamoDB({
  //   accessKeyId: ConfigUtil.get('aws.accessKeyId'),
  //   secretAccessKey: ConfigUtil.get('aws.secretAccessKey'),
  //   region: ConfigUtil.get('aws.region'),
  //   endpoint: ConfigUtil.get('dynamodb.local'),
  // });
  // const dynamoDB = dynamoose.aws.ddb();
  // await new Promise((resolve, reject) => {
  //   ddb.deleteTable({ TableName }, (err, resp) => {
  //     console.log(err);
  //     console.log(resp);
  //     if (err) return reject(err);
  //     return resolve(resp);
  //   });
  // });
};

export const authBearerToken = (accessToken) => {
  return `Bearer ${accessToken}`;
};

export const dataTesting = async (): Promise<any> => {
  const authCredentialsInput = {
    email: faker.internet.email(),
    password: faker.internet.password(10),
  };
  await userService.signUp(authCredentialsInput);
  const { accessToken } = await userService.signIn(authCredentialsInput);
  return { accessToken };
};
