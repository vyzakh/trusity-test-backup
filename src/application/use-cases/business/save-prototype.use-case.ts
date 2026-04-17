import { ICurrentStudentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException, InformationException, NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface SavePrototypetUseCaseInput {
  data: {
    businessId: string;
    prototypeImages: string[];
  };
  user: ICurrentStudentUser;
}

export class SavePrototypetUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: SavePrototypetUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;
    const actionAt = genTimestamp().iso;

    switch (user.scope) {
      case UserScope.STUDENT: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const businessQuery = {
      businessId: data.businessId,
      schoolId: user.schoolId,
      studentId: user.id,
    };

    const businessProgressScore = await businessRepo.getBusinessProgressScore(businessQuery);
    if (!businessProgressScore) {
      throw new NotFoundException('The progress details for this business could not be found.');
    }

    if (!businessProgressScore.prototype && businessProgressScore.prototype === 0) {
      throw new InformationException('A score of zero cannot be saved. Please try again to achieve a higher score.');
    }

    await businessRepo.updateBusinessProgressStatus({
      ...businessQuery,
      prototypeStatus: true,
      updatedAt: actionAt,
    });

    return await businessRepo.updateBusiness({
      ...businessQuery,
      prototypeImages: data.prototypeImages,
      updatedAt: actionAt,
    });
  }
}
