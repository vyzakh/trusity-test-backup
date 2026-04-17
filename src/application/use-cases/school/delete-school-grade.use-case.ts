import { ICurrentUser } from '@core/types';
import { PlatformUserRepository, SchoolAdminRepository, SchoolRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface DeleteSchoolGradeUseCaseInput {
  data: {
    schoolId?: string | null;
    gradeId: number;
  };
  user: ICurrentUser;
}

export class DeleteSchoolGradeUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
      platformUserRepo: PlatformUserRepository;
      notificationRepo: NotificationRepository;
      emailService: EmailService;
      ws: WSGateway;
      schoolAdminRepo: SchoolAdminRepository;
    },
  ) {}

  async execute(input: DeleteSchoolGradeUseCaseInput) {
    const { schoolRepo, platformUserRepo, notificationRepo, emailService, ws, schoolAdminRepo } = this.dependencies;
    const { data, user } = input;

    const payload: Record<string, any> = {
      gradeId: data.gradeId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        Object.assign(payload, {
          schoolId: data.schoolId,
        });
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    await schoolRepo.deleteSchoolGrade(payload);
  }
}
