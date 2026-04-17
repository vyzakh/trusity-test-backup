import { Mutation, Resolver } from '@nestjs/graphql';
import { BusinessResult } from './types/problem-statement.type';

@Resolver()
export class BusinessFeedbackResolver {
  @Mutation(() => BusinessResult)
  async createBusinessFeeback() {}
}
