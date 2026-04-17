import { ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@ObjectType()
export class UnassignChallengeResult extends BaseResult {}
