import { GetAssignedChallengesUseCase } from '@application/use-cases';
import { TotalAssignedChallengesUseCase } from '@application/use-cases/challenge/total-assigned-challenges.use-case';
import { ChallengeRepository, DatabaseService } from '@infrastructure/database';
import { Args, Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AssignedChallenge } from '../challenge/types';
import { AssignedChallengesArgs, Student } from './types';

@Resolver(() => Student)
export class StudentUserResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => [AssignedChallenge])
  async assignedChallenges(@Parent() student: Student, @Args() args: AssignedChallengesArgs) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetAssignedChallengesUseCase({
          challengeRepo,
        });

        return await useCase.execute({
          data: {
            ...args,
            studentId: student.id,
          },
        });
      },
    });
  }


  @ResolveField(() => Int)
  async totalAssignedChallenges(@Parent() student: Student) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new TotalAssignedChallengesUseCase({
          challengeRepo,
        });

        return await useCase.execute({
          data: {
            studentId: student.id,
          },
        });
      },
    });
  }
}
