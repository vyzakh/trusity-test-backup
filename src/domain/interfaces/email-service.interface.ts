export interface EmailPayload {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
}

export interface EmailService {
  sendEmail(email: EmailPayload): Promise<void>;
  sendEmails?(emails: EmailPayload[]): Promise<void>;
}
