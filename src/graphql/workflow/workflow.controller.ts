import { Body, Controller, Header, Param, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';

@Controller('workflows')
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Post('trigger/:workflowActivityId')
  @Header('Access-Control-Allow-Origin', '*')
  trigger(@Param() params: string[], @Body() payload: any): Promise<any> {
    return this.workflowService.trigger(params, payload);
  }
}
