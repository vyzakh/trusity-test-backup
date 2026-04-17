import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetBusinessUseCaseInput {
  data: { businessId: string };
  user: ICurrentUser;
}

export class GetBusinessUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetBusinessUseCaseInput) {
    const { businessRepo } = this.dependencies;
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
        break;
      }
      case UserScope.TEACHER: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await businessRepo.getBusiness(query);
  }
}
