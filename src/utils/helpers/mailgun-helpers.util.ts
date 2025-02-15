import { Logger } from '@nestjs/common';

import { ConfigUtil } from '@lambdascrew/utility';

// @ts-ignore
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const apiKey = ConfigUtil.get('mailgun.apiKey');
const domain = ConfigUtil.get('mailgun.domain');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: apiKey });
const logger = new Logger('Mailgun');

export async function mailgunSendEmail(payload: { Email: string; Body: string; Subject: string }) {
  const { Email, Subject, Body } = payload;

  const data = {
    from: ConfigUtil.get('mailgun.fromEmail'),
    to: Email,
    cc: ConfigUtil.get('mailgun.ccEmail'),
    subject: Subject,
    html: Body,
  };

  logger.log('Executing mailgun to send email');
  logger.log('data:', data);
  mg.messages
    .create(domain, data)
    .then((msg) => logger.log('Mailgun log:', msg))
    .catch((err) => {
      logger.error('Mailgun response:', err.message);
      logger.error('Mailgun response:', err.details);
    });
}
