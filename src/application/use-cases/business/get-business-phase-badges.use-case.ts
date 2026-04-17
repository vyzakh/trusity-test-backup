import { ICurrentUser } from '@core/types';
import { BadgeRepository, BusinessRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetBusinessPhaseBadgesUseCaseInput {
  data: {
    businessId: string;
  };
  user: ICurrentUser;
}

export class GetBusinessPhaseBadgesUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository; badgeRepo: BadgeRepository }) {}

  async execute(input: GetBusinessPhaseBadgesUseCaseInput) {
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

    const { averageIScore, averageEScore, averageCScore } = await businessRepo.getBusinessAverageScore(query);

    const [innovationBadge, entrepreneurshipBadge, communicationBadge] = await Promise.all([
      badgeRepo.getBadgeByScore({
        score: averageIScore,
      }),
      badgeRepo.getBadgeByScore({
        score: averageEScore,
      }),
      badgeRepo.getBadgeByScore({
        score: averageCScore,
      }),
    ]);

    return [
      {
        phaseKey: 'innovation',
        phaseName: 'Innovation',
        badge: innovationBadge ? { ...innovationBadge, iconUrl: innovationBadge.iIconUrl } : null,
      },
      {
        phaseKey: 'entrepreneurship',
        phaseName: 'Entrepreneurship',
        badge: entrepreneurshipBadge ? { ...entrepreneurshipBadge, iconUrl: entrepreneurshipBadge.eIconUrl } : null,
      },
      {
        phaseKey: 'communication',
        phaseName: 'Communication',
        badge: communicationBadge ? { ...communicationBadge, iconUrl: communicationBadge.cIconUrl } : null,
      },
    ];
  }
}
