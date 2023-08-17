import { Body, Controller, Get, Post } from '@nestjs/common';

import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('/create-payment-intent')
  async createPaymentIntent() {
    return this.billingService.createPaymentIntent();
  }

  @Post('/create-subscription')
  async createSubscription(@Body() body: any) {
    return this.billingService.createSubscription(body);
  }

  @Post('/cancel-subscription')
  async cancelSubscription(@Body() body: any) {
    return this.billingService.cancelSubscription(body);
  }

  @Post('/check-subscription')
  async checkSubscription(@Body() body: any) {
    return this.billingService.checkSubscription(body);
  }

  @Post('/get-plans')
  async getProductList() {
    return this.billingService.getProductList();
  }

  @Post('/get-customer-details')
  async getCustomerDetails(@Body() body: any) {
    return this.billingService.getStripeCustomerDetails(body);
  }

  @Post('/check-balance')
  async checkBalance(@Body() body: any) {
    return this.billingService.checkBalance(body);
  }
}
