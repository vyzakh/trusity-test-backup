import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ICurrentUser } from 'src/core/types';
import { UserScope } from '@shared/enums';
import { GetChallengeUseCase } from '@application/use-cases';
import { ForbiddenException } from '@shared/execeptions';
import { ChallengeRepository, DatabaseService } from '@infrastructure/database';
import { getRequestFromContext } from '@presentation/graphql/shared/utils';

@Injectable()
export class ChallengeAccessGuard implements CanActivate {
  constructor(private readonly dbService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, args } = getRequestFromContext(context);
    const { user } = request as { user: ICurrentUser };

    console.log(args);

    return true;
  }
}
