import { Logger } from '@nestjs/common';
import { ConfigUtil } from './config.util';

// @ts-ignore
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const apiKey = ConfigUtil.get('mailgun.apiKey');
const domain = ConfigUtil.get('mailgun.domain');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: apiKey });
const logger = new Logger('Mailgun');

export async function mailgunSendEmail(email: string) {
  const html = `
        <html>
            <p><b>Email Address:</b> ${email}</p>
        </html>
    `;

  const data = {
    from: ConfigUtil.get('mailgun.fromEmail'),
    to: ConfigUtil.get('mailgun.toEmail'),
    cc: ConfigUtil.get('mailgun.ccEmail'),
    subject: 'Mailgun Testing Email',
    html,
  };

  logger.log('Executing mailgun to send email');
  mg.messages
    .create(domain, data)
    .then((msg) => logger.log(msg))
    .catch((err) => logger.log(err));
}
