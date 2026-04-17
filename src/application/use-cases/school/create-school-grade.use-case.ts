import { ICurrentUser } from '@core/types';
import { PlatformUserRepository, SchoolAdminRepository, SchoolRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface CreateSchoolGradeUseCaseInput {
  data: {
    schoolId?: string | null;
    gradeId: number;
    sectionIds: number[];
  };
  user: ICurrentUser;
}

export class CreateSchoolGradeUseCase {
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

  async execute(input: CreateSchoolGradeUseCaseInput) {
    const { schoolRepo, platformUserRepo, notificationRepo, emailService, ws, schoolAdminRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      gradeId: data.gradeId,
      schoolId: data.schoolId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
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

    await schoolRepo.upsertSchoolGrade(payload);

    const schoolSections = data.sectionIds.map((sectionId) => ({
      schoolId: payload.schoolId,
      gradeId: payload.gradeId,
      sectionId,
    }));

    if (schoolSections.length > 0) {
      await schoolRepo.upsertSchoolSections(schoolSections);
    }
  }
}
