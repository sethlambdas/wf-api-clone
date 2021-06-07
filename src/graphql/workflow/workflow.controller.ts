import { Body, Controller, Param, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';

@Controller('workflows')
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Post('trigger/:workflowActivityId')
  trigger(@Param() params: string[], @Body() payload: any): Promise<string> {
    return this.workflowService.trigger(params, payload);
  }
}
