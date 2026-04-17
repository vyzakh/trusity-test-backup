import { GetChallengeUseCase } from '@application/use-cases';
import { ChallengeRepository, DatabaseService } from '@infrastructure/database';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';
import { ICurrentUser } from 'src/core/types';
import { getRequestFromContext } from '../utils';

@Injectable()
export class ChallengeAccessGuard implements CanActivate {
  constructor(private readonly dbService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, args } = getRequestFromContext(context);
    const { user } = request as { user?: ICurrentUser };

    if (!user) {
      throw new ForbiddenException('Unauthorized access');
    }

    const challengeId = args?.challengeId;

    if (!challengeId) {
      throw new ForbiddenException('Challenge ID not provided');
    }

    const challenge = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeUseCase({ challengeRepo });
        return await useCase.execute(challengeId);
      },
    });

    switch (user.scope) {
      case UserScope.PLATFORM_USER:
        return true;
      case UserScope.SCHOOL_ADMIN:
        if (challenge?.schoolId?.toString() === user.schoolId) {
          return true;
        } else {
          throw new ForbiddenException('You are not allowed to access this challenge (school mismatch)');
        }
      case UserScope.TEACHER:
        if (challenge?.createdBy?.toString() === user.userAccountId) {
          return true;
        } else {
          throw new ForbiddenException('You are not allowed to access this challenge (creator mismatch)');
        }
      default:
        throw new ForbiddenException('You are not allowed to perform this action');
    }
  }
}
