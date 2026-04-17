import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

interface EmailPayload {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private config?: {
    from: string;
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<{
      from: string;
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    }>('nodemailer');

    this.transporter = createTransport(this.config);
  }

  async sendEmail(email: EmailPayload) {
    return await this.transporter.sendMail({
      from: this.config!.from,
      ...email,
    });
  }

  async sendEmails(emails: EmailPayload[]) {
    throw new Error('Method not implemented.');
  }

  static handleEmailSuccess(info: any) {
    console.log('[EmailService] Email sent successfully:', info?.messageId);
  }
  static handleEmailError(error: any) {
    console.error(`[EmailService] Error sending email: ${error?.message}`);
  }
}
