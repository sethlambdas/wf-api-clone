import { ConfigUtil } from '@lambdascrew/utility';
import { Injectable, Logger } from '@nestjs/common';
import { SaveOrganizationInput } from '../../graphql/organizations/inputs/save-organization.input';
import { OrganizationService } from '../../graphql/organizations/organization.service';
import { User } from '../../graphql/users/user.entity';
import { UserService } from '../../graphql/users/user.service';

@Injectable()
export class PaymentService {
  constructor(private userService: UserService, private organizationService: OrganizationService) {}

  async createPaymentIntent(): Promise<any> {
    const payment = 'test';
    const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'AUD',
        amount: 1999,
        automatic_payment_methods: { enabled: true },
      });

      // Send publishable key and PaymentIntent details to client
      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (e) {
      return {
        status: 400,
        data: e,
      };
    }
  }

  async createSubscription(body: any): Promise<any> {
    const { email, payment_method, pk } = body;
    const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));

    try {
      // check if user already in stripe
      const user: User = await this.userService.getUserByKey(pk);
      let customer: any;

      if (!user.stripeCustomerId) {
        customer = await stripe.customers.create({
          payment_method: payment_method,
          email: email,
          invoice_settings: {
            default_payment_method: payment_method,
          },
        });
      } else {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      }

      if (customer) {
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ plan: 'price_1NSChxKnTggJv0dQWBLyfyiy' }],
        });
        await this.userService.saveUser(pk, { subscriptionId: subscription.id, stripeCustomerId: customer.id });

        // subscribe the organization
        const organizationInput: SaveOrganizationInput = {
          PK: user.PK.split('|')[0],
          subscriptionId: subscription.id,
          stripeCustomerId: customer.id,
        };
        await this.organizationService.saveOrganization(organizationInput);

        return { status: 200, subscription: subscription };
      }
    } catch (e) {
      return {
        status: 400,
        data: e,
      };
    }
  }

  async checkSubscription(body: any): Promise<any> {
    const { pk } = body;
    const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));

    const user: User = await this.userService.getUserByKey(pk);
    let subscription: any;
    if (user?.subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(user.subscriptionId);

      return { status: 200, subscription };
    }

    return { status: 404, subscription };
  }

  async checkBalance(body: any): Promise<any> {
    const { pk } = body;
    const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));

    const user: User = await this.userService.getUserByKey(pk);
    if (user?.subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);

      const { current_period_end, current_period_start, items: subscriptionItems } = subscription;
      const meteredSubscriptionItem = this.findMeteredData(subscriptionItems.data);
      const usage_records = await stripe.subscriptionItems.listUsageRecordSummaries(meteredSubscriptionItem.id);
      const price = await stripe.prices.retrieve(meteredSubscriptionItem.plan.id, {
        expand: ['tiers'],
      });

      const total_usage = usage_records.data[0];

      return {
        status: 200,
        usage_records: {
          start: current_period_start,
          end: current_period_end,
          usage: total_usage,
        },
        items: subscriptionItems,
        price: price,
      };
    }

    return { status: 404, balance: 0 };
  }

  async reportUsageRecord(subscriptionId: string): Promise<any> {
    try {
      const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));
      const currentDate = new Date();

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const subscriptionItemId = subscription.items.data[0].id;

      const usageRecord = await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity: 1,
        timestamp: Math.floor(currentDate.getTime() / 1000),
      });

      if (usageRecord) {
        return { status: 200, usageRecord };
      }
    } catch (error) {
      return { status: 500, error };
    }
  }

  findMeteredData(data: any[]) {
    return data.find((item) => item.plan.usage_type === 'metered') || null;
  }
}
