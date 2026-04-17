import { ICurrentUser } from '@core/types';
import { BadgeRepository, BusinessRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetBusinessAchievedBadgeUseCaseInput {
  data: { businessId: string };
  user: ICurrentUser;
}

export class GetBusinessAchievedBadgeUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository; badgeRepo: BadgeRepository }) {}

  async execute(input: GetBusinessAchievedBadgeUseCaseInput) {
    const { businessRepo, badgeRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      businessId: data.businessId,
    };

    switch (user.scope) {
      case UserScope.STUDENT: {
        query.studentId = user.id;
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

    const { averageScore } = await businessRepo.getBusinessAverageScore(query);

    if (!averageScore) return null;

    const badge = await badgeRepo.getBadgeByScore({
      score: averageScore,
    });

    return {
      badge,
      badgeScore: averageScore,
    };
  }
}
