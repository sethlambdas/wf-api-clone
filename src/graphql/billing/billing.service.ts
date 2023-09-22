import { ConfigUtil } from '@lambdascrew/utility';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  getApiGatewayApiKey,
  updateApiGatewayApiKey,
  updateUsagePlanAPIGateway,
} from '../../aws-services/api-gateway/api-gateway.util';
import { disableRule, enableRule } from '../../aws-services/event-bridge/event-bridge.util';
import { UserRoleEnum } from '../common/enums/user-roles.enum';
import { SaveOrganizationInput } from '../organizations/inputs/save-organization.input';
import { OrganizationService } from '../organizations/organization.service';
import { User } from '../users/user.entity';
import { UserService } from '../users/user.service';
import { WorkflowExecutionService } from '../workflow-executions/workflow-execution.service';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class BillingService {
  constructor(
    @Inject(forwardRef(() => WorkflowService))
    private workflowService: WorkflowService,
    private userService: UserService,
    private organizationService: OrganizationService,
    private workflowExecutionService: WorkflowExecutionService,
  ) {}

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
    const { email, payment_method, pk, plan } = body;
    const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));

    try {
      // check if user already in stripe
      const user: User = await this.userService.getUserByKey(pk);
      const organization = await this.organizationService.getOrganization({ PK: user.PK.split('|')[0] });
      let customer: any;

      const apiKey = await getApiGatewayApiKey({ apiKey: organization.apiKey });

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
          items: [{ plan: plan }],
          // collection_method: 'send_invoice',
          // days_until_due: 5,
        });

        const wfexecutions = await this.workflowExecutionService.listWorkflowExecutionsOfAnOrganization({
          OrgId: organization.PK,
        });
        const workflows = await this.workflowService.getWorkflowOfAnOrg({ orgId: organization.PK, page: 1 });
        for (let i = 0; i < workflows.Workflows.length; i++) {
          const wfElement = workflows.Workflows[i];
          if (wfElement.TimeTriggerRuleName) {
            await enableRule({ Name: wfElement.TimeTriggerRuleName });
          }
          // for double security disables both trigger and time trigger
          await this.workflowService.enableWorkflowTrigger({ PK: wfElement.PK, SK: wfElement.SK });
        }
        await updateApiGatewayApiKey(apiKey.id, [{ op: 'replace', path: '/enabled', value: 'true' }]);
        const product = await stripe.products.retrieve(subscription.items.data[0].price.product);
        const metadata = product.metadata;

        let patchOperations: any = [
          { op: 'replace', path: '/quota/period', value: 'MONTH' },
          { op: 'replace', path: '/throttle/rateLimit', value: metadata?.rateLimit || '10' },
          { op: 'replace', path: '/throttle/burstLimit', value: metadata?.burstLimit || '10' },
        ];

        if (metadata?.limit == -1) {
          patchOperations.push({ op: 'remove', path: '/quota' });
        } else {
          patchOperations.push({ op: 'replace', path: '/quota/limit', value: metadata?.limit || '15' });
        }
        Logger.log('Patch:', patchOperations);

        let usagePlan: any;

        usagePlan = await updateUsagePlanAPIGateway({
          usagePlanId: organization.usagePlanId,
          patchOperations: patchOperations,
        });

        const saveUser = await this.userService.saveUser(pk, {
          subscriptionId: subscription.id,
          stripeCustomerId: customer.id,
          role: plan ? UserRoleEnum.ADMINISTRATOR : UserRoleEnum.TRIAL,
        });

        // subscribe the organization
        const organizationInput: SaveOrganizationInput = {
          PK: user.PK.split('|')[0],
          subscriptionId: subscription.id,
          stripeCustomerId: customer.id,
          apiKey: apiKey.id,
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

  async cancelSubscription(body: any): Promise<any> {
    const { pk } = body;
    const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));

    try {
      // check if user already in stripe
      const user: User = await this.userService.getUserByKey(pk);
      let customer: any;
      if (!user.stripeCustomerId) {
        return {
          status: 404,
          data: {},
        };
      }

      const deleted = await stripe.subscriptions.cancel(user.subscriptionId, {
        invoice_now: true,
      });

      const organization = await this.organizationService.getOrganization({ PK: user.PK.split('|')[0] });
      // disables rules and api gateway apikey
      await this.disableRuleAndApiKey(organization.PK);

      // remove subscriptionId
      const saveUser = await this.userService.saveUser(pk, {
        subscriptionId: '',
        role: UserRoleEnum.TRIAL,
      });
      const organizationInput: SaveOrganizationInput = {
        PK: user.PK.split('|')[0],
        subscriptionId: '',
      };
      await this.organizationService.saveOrganization(organizationInput);
      return { status: 200, subscription: deleted };
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
      const invoice = await stripe.invoices.retrieveUpcoming({
        subscription: user.subscriptionId, //can also be customer id
      });

      return {
        status: 200,
        invoice,
      };
    }

    return { status: 404, balance: 0 };
  }

  async getProductList(): Promise<any> {
    try {
      const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));

      const products = await stripe.products.list({
        active: true,
        expand: ['data.default_price', 'data.default_price.product', 'data.default_price.tiers'],
      });

      return { status: 200, products };
    } catch (error) {
      return { status: 500, error };
    }
  }

  async getStripeCustomerDetails(body: any): Promise<any> {
    try {
      const { pk } = body;
      const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));
      // check if user already in stripe
      const user: User = await this.userService.getUserByKey(pk);
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);

      return { status: 200, customer };
    } catch (error) {
      return { status: 500, error };
    }
  }

  async reportUsageRecord(orgId: string, subscriptionId?: string): Promise<any> {
    try {
      const organization = await this.organizationService.getOrganization({ PK: orgId });
      if (subscriptionId) {
        const stripe = require('stripe')(ConfigUtil.get('stripe.sk'));
        const currentDate = new Date();

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const subscriptionItemId = subscription.items.data[0].id;

        const usageRecord = await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
          quantity: 1,
          timestamp: Math.floor(currentDate.getTime() / 1000),
        });

        // check usage record summary
        Logger.log('check usage record summary');
        const usageRecordSummaries = await stripe.subscriptionItems.listUsageRecordSummaries(subscriptionItemId);
        Logger.log('Usage Record Summary:', usageRecordSummaries);
        const totalUsage = usageRecordSummaries?.data[0]?.total_usage || 0;
        const product = await stripe.products.retrieve(subscription.items.data[0].price.product);
        const metadata = product.metadata;
        if (metadata?.limit != -1) {
          if (totalUsage >= metadata?.limit) {
            await this.disableRuleAndApiKey(orgId);
          }
        }
        Logger.log('Usage Record log:', usageRecord);
        if (usageRecord) {
          return { status: 200, usageRecord };
        }
      } else {
        await this.disableRuleAndApiKey(orgId);
      }
    } catch (error) {
      return { status: 500, error };
    }
  }

  findMeteredData(data: any[]) {
    return data.find((item) => item.plan.usage_type === 'metered') || null;
  }

  async disableRuleAndApiKey(orgId: string) {
    const organization = await this.organizationService.getOrganization({ PK: orgId });
    const wfexecutions = await this.workflowExecutionService.listWorkflowExecutionsOfAnOrganization({
      OrgId: orgId,
    });
    const workflows = await this.workflowService.getWorkflowOfAnOrg({ orgId: orgId, page: 1 });
    if (wfexecutions.TotalWorkflowExecution.TotalRecords >= 4) {
      for (let i = 0; i < workflows.Workflows.length; i++) {
        const wfElement = workflows.Workflows[i];
        if (wfElement.TimeTriggerRuleName) {
          await disableRule({ Name: wfElement.TimeTriggerRuleName });
        }
        // for double security disables both trigger and time trigger
        await this.workflowService.disableWorkflowTrigger({ PK: wfElement.PK, SK: wfElement.SK });
      }
      const apiKey = await getApiGatewayApiKey({ apiKey: organization.apiKey });
      // disable the api key for apigateway
      await updateApiGatewayApiKey(apiKey.id, [{ op: 'replace', path: '/enabled', value: 'false' }]);
    }
  }
}
