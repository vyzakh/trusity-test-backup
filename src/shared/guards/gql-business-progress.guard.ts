import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Knex } from 'knex';

export interface BusinessProgressStatus {
  business_id: number;
  idea: boolean;
  problem_statement: boolean;
  market_research: boolean;
  market_fit: boolean;
  prototype: boolean;
}

@Injectable()
export class BusinessProgressGuard implements CanActivate {
  constructor(
    @Inject('KnexConnection') private readonly knex: Knex,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();

    const businessId = req.user?.businessId || gqlContext.getArgs().businessId;

    if (!businessId) {
      throw new ForbiddenException('Business ID is missing');
    }

    const requiredStages = this.reflector.get<(keyof BusinessProgressStatus)[]>('requiredStages', context.getHandler()) || [];

    const status = await this.knex<BusinessProgressStatus>('business_progress_status').where({ business_id: businessId });

    if (!status) {
      throw new ForbiddenException('Business progress not found');
    }

    for (const stage of requiredStages) {
      if (!status[stage]) {
        throw new ForbiddenException(`Stage "${stage}" is not completed`);
      }
    }

    return true;
  }
}
