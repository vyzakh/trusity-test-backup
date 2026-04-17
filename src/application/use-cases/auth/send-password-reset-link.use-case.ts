import { getConfigService } from '@infrastructure/config';
import { UserAccountRepository } from '@infrastructure/database';
import { EmailService } from '@infrastructure/email';
import { compileHbsTemplate, genRandomBytes, genTimestamp } from '@shared/utils';
import { join } from 'path';

interface SendPasswordResetLinkUseCaseInput {
  data: { email: string };
}

export class SendPasswordResetLinkUseCase {
  constructor(private readonly dependencies: { emailService: EmailService; userAccountRepo: UserAccountRepository }) {}

  async execute(input: SendPasswordResetLinkUseCaseInput) {
    const { userAccountRepo, emailService } = this.dependencies;
    const { data } = input;

    const passwordResetToken = genRandomBytes(32);
    const passwordResetTokenExp = genTimestamp({ hours: 1 });

    const userAccount = await userAccountRepo.updateUserAccount({
      qEmail: data.email,
      passwordResetToken,
      passwordResetTokenExpAt: passwordResetTokenExp.iso,
      updatedAt: genTimestamp().iso,
    });

    if (userAccount) {
      const configService = await getConfigService();

      sendSendPasswordResetLinkEmail(emailService, {
        email: data.email,
        passwordResetLink: `${configService.get<string>('app.homeUrl')!}/reset-password/${passwordResetToken}`,
        passwordResetExp: passwordResetTokenExp.human,
      });
    }
  }
}

async function sendSendPasswordResetLinkEmail(emailService: EmailService, context: Record<string, any>) {
  try {
    const html = await compileHbsTemplate({
      templatePath: join(process.cwd(), 'src/presentation/views/password-reset-mail.hbs'),
      context,
    });

    const result = await emailService.sendEmail({
      to: context.email,
      subject: 'Reset Your Password - TruPreneurs.AI',
      html,
    });
  } catch (error) {}
}
