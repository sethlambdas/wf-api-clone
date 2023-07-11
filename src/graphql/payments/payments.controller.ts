import { Body, Controller, Get, Post } from '@nestjs/common';

import { PaymentService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentService: PaymentService) {}

  @Post('/create-payment-intent')
  async createPaymentIntent() {
    return this.paymentService.createPaymentIntent();
  }

  @Post('/create-subscription')
  async createSubscription(@Body() body: any) {
    return this.paymentService.createSubscription(body);
  }

  @Post('/check-subscription')
  async checkSubscription(@Body() body: any) {
    return this.paymentService.checkSubscription(body);
  }

  @Post('/check-balance')
  async checkBalance(@Body() body: any) {
    return this.paymentService.checkBalance(body);
  }
}
