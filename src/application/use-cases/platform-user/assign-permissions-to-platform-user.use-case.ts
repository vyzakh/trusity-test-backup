import { LookupRepository, PlatformUserRepository } from '@infrastructure/database';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { EmailService } from '@infrastructure/email';
import { compileHbsTemplate } from '@shared/utils';
import { join } from 'path';

interface AssignPermissionsToPlatformUserUseCaseInput {
  data: { platformUserId: string; permissionIds?: number[] };
}

export class AssignPermissionsToPlatformUserUseCase {
  constructor(
    private readonly dependencies: {
      platformUserRepo: PlatformUserRepository;
      lookupRepo: LookupRepository;
      sessionRepo: SessionRepository;
      emailService: EmailService;
    },
  ) {}

  async execute(input: AssignPermissionsToPlatformUserUseCaseInput) {
    const { platformUserRepo, sessionRepo, emailService } = this.dependencies;
    const { data } = input;

    await platformUserRepo.deletePermissions({
      platformUserId: data.platformUserId,
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      await platformUserRepo.assignPermissions({
        platformUserId: data.platformUserId,
        permissionIds: data.permissionIds,
      });
    }
    const latestPermissions = await platformUserRepo.getPermissions({
      platformUserId: data.platformUserId,
    });

    const platformUser = await platformUserRepo.getPlatformUser({ platformUserId: data.platformUserId });

    if (platformUser) {
      await sessionRepo.updateUserProfileInSessions({
        userId: String(platformUser.id),
        userScope: platformUser.scope,
        updates: {
          permissions: latestPermissions.map((p) => p.code),
        },
      });
      sendPlatformUserPermissionUpdateEmail(emailService, {
        adminName: platformUser.name,
        email: platformUser.email,
      });
    }
  }
}

async function sendPlatformUserPermissionUpdateEmail(emailService: EmailService, context: { adminName: string; email: string }) {
  try {
    const html = await compileHbsTemplate({
      templatePath: join(process.cwd(), 'src/presentation/views/permission-update-notification.hbs'),
      context,
    });

    await emailService.sendEmail({
      to: context.email,
      subject: 'Your Permission on TruPreneurs.AI has been updated',
      html,
    });
  } catch (error) {}
}
