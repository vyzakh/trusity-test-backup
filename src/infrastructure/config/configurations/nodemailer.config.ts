import { registerAs } from '@nestjs/config';

export const nodemailerConfig = registerAs('nodemailer', () => {
  return {
    from: process.env.EMAIL_FROM_ADDRESS,
    host: process.env.AWS_SES_SMTP_HOST,
    port: parseInt(process.env.AWS_SES_SMTP_PORT!, 10),
    secure: false,
    auth: {
      user: process.env.AWS_SES_SMTP_USERNAME,
      pass: process.env.AWS_SES_SMTP_PASSWORD,
    },
  };
});
