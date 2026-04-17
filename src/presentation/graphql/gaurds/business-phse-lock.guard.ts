import { BusinessPhaseLockRepository, BusinessRepository, DatabaseService } from '@infrastructure/database';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { BUSINESS_PHASE_KEY } from '@shared/decorators/check-business-phse-lock.decorator';
import { BusinessPhaseEnum } from '@shared/enums/business-phase.enum';
import { ForbiddenException } from '@shared/execeptions';
import { getRequestFromContext } from '../shared/utils';

@Injectable()
export class BusinessPhaseLockGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dbService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const phase = this.reflector.get<BusinessPhaseEnum>(BUSINESS_PHASE_KEY, context.getHandler());

    if (!phase) {
      return true;
    }

    const { request, args } = getRequestFromContext(context);

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    const businessId = args?.businessId;
    if (!businessId) {
      throw new ForbiddenException('Business ID not provided');
    }

    await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        phaseLockRepo: new BusinessPhaseLockRepository(db),
      }),
      callback: async ({ businessRepo, phaseLockRepo }) => {
        const business = await businessRepo.getBusiness({ businessId });

        if (!business) {
          throw new ForbiddenException('Business not found');
        }

        const lock = await phaseLockRepo.getBusinessPhaseLock({
          studentId: business.studentId,
          academicYearId: business.academicYearId,
          phase,
        });

        if (!lock) {
          return true;
        }

        if (lock.is_locked) {
          throw new ForbiddenException(`Phase ${phase} is locked for this academic year`);
        }

        return true;
      },
    });

    return true;
  }
}
