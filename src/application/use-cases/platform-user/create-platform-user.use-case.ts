import { join } from 'path';
import { UserScope } from '@shared/enums';
import { EmailService } from '@infrastructure/email';
import { getConfigService } from '@infrastructure/config';
import { compileHbsTemplate, generateRandomPassword, hashPassword, sanitizeInput } from '@shared/utils';
import { UserAccountRepository, PlatformUserRepository } from '@infrastructure/database';

interface CreatePlatformUserUseCaseInput {
  data: {
    name: string;
    email: string;
    contactNumber?: string | null;
  };
}

export class CreatePlatformUserUseCase {
  constructor(
    private readonly dependencies: {
      userAccountRepo: UserAccountRepository;
      platformUserRepo: PlatformUserRepository;
      emailService: EmailService;
    },
  ) {}

  async execute(input: CreatePlatformUserUseCaseInput) {
    const { userAccountRepo, platformUserRepo, emailService } = this.dependencies;
    const { data } = input;

    const configService = await getConfigService();

    const password = generateRandomPassword();
    const { salt, hash } = hashPassword(password);

    const userAccount = await userAccountRepo.createUserAccount({
      email: sanitizeInput(data.email),
      scope: UserScope.PLATFORM_USER,
    });

    await userAccountRepo.createUserAuth({
      userAccountId: userAccount.id,
      passwordSalt: salt,
      passwordHash: hash,
    });

    const payload = {
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email),
      contactNumber: data.contactNumber,
      userAccountId: userAccount.id,
    };

    const platformUser = await platformUserRepo.createPlatformUser(payload);

    sendPlatformUserWelcomeEmail(emailService, {
      name: platformUser.name,
      email: platformUser.email,
      loginUrl: `${configService.get<string>('app.homeUrl')!}/login`,
      password,
    });

    return platformUser;
  }
}

async function sendPlatformUserWelcomeEmail(
  emailService: EmailService,
  context: { name: string; email: string; password: string; loginUrl: string },
) {
  try {
    const html = await compileHbsTemplate({
      templatePath: join(process.cwd(), 'src/presentation/views/platform-user-welcome.hbs'),
      context,
    });

    await emailService.sendEmail({
      to: context.email,
      subject: 'Your Account Credentials for TruPreneurs.AI',
      html,
    });
  } catch (error) {}
}
