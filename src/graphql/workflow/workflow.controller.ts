import { Body, Controller, Header, Param, Post, Response } from '@nestjs/common';
import { Response as Res } from 'express';
import { WorkflowService } from './workflow.service';

@Controller('workflows')
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Post('trigger/:workflowActivityId')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Expose-Headers', 'workflow-execution-key-pk')
  trigger(@Response() res: Res, @Param() params: string[], @Body() payload: any): Promise<any> {
    return this.workflowService.trigger(res, params, payload);
  }
}
