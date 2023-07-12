import * as nodemailer from 'nodemailer';

import { ConfigUtil } from '@lambdascrew/utility';

export class EmailUtil {
  static sendEmail(to: string, subject: string, html: string) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ConfigUtil.get('email.gmail.user'),
        pass: ConfigUtil.get('email.gmail.password'),
        type: 'login'
      },
    });
    transporter.sendMail({
      to,
      subject,
      html,
    });
  }
}
