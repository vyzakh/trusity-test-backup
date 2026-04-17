import { ICurrentUser } from '@core/types';
import { BadgeRepository, BusinessRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';

interface GetStudentBadgeUseCaseInput {
  data: {
    studentId: string;
    academicYearId?: string;
    enrollmentStatus?: EnrollmentStatusEnum;
  };
  user: ICurrentUser;
}

export class GetStudentBadgeUseCase {
  constructor(private readonly dependencies: { badgeRepo: BadgeRepository; businessRepo: BusinessRepository }) {}

  async execute(input: GetStudentBadgeUseCaseInput) {
    const { badgeRepo, businessRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      enrollmentStatus: data.enrollmentStatus,
    };

    if (!data.academicYearId) {
      Object.assign(query, {
        enrollmentStatus: data.enrollmentStatus ?? EnrollmentStatusEnum.ACTIVE,
      });
    }

    switch (user.scope) {
      case UserScope.STUDENT: {
        query.studentId = user.id;
        query.academicYearId = data.academicYearId ?? user.currentAYId;
        break;
      }
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        query.schoolId = user.schoolId;
        break;
      }
      case UserScope.TEACHER: {
        query.schoolId = user.schoolId;
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const [topPerformedBusiness] = await businessRepo.getTopPerformedBusinesses(query);

    if (!topPerformedBusiness) return null;

    const badge = await badgeRepo.getBadgeByScore({
      score: topPerformedBusiness.averageScores.averageScore,
    });

    return {
      badge,
      badgeScore: topPerformedBusiness.averageScores.averageScore,
    };
  }
}
