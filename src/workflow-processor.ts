import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './graphql/app.module';
import { WorkflowSpecService } from './graphql/workflow-specs/workflow-spec.service';
import { WorkflowVersionService } from './graphql/workflow-versions/workflow-version.service';
import { ConfigUtil } from './utils/config.util';

async function main() {
  const logger = new Logger('ImapProcessor');
  const app = await NestFactory.create(AppModule, {
    logger: ConfigUtil.get('logLevel'),
  });

  const workflowVersionService = app.get(WorkflowVersionService);
  const workflowSpecService = app.get(WorkflowSpecService);
  // const tesseractService = app.get(TesseractService);

  logger.log('ImapProcessor has started running...');

  // await workflowVersionService.createWorkflowVersion({
  //   WVID: '1',
  //   CID: 'email@email.com',
  //   WID: 'password',
  // });

  // console.log(await workflowVersionService.listWorkflowVersions());

  await workflowSpecService.createWorkflowSpec({
    WSID: '2',
    WVID: 'email@email.com',
    NAID: 'password',
  });

  const listWorkflow = await workflowSpecService.listWorkflowSpecs();

  // console.log(listWorkflow);

  // await ImapUtil.run(workflowVersionsService, tesseractService);
  logger.log('ImapProcessor has ended...');
}

main();
