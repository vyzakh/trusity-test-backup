import { ArgsType, Field, Int } from '@nestjs/graphql';
import { ChallengeVisibility } from '@shared/enums';

@ArgsType()
export class UpdateChallengeArgs {
  @Field(() => String)
  challengeId: string;

  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => String, { nullable: true })
  companyName: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => ChallengeVisibility, { nullable: true })
  visibility: ChallengeVisibility;

  @Field(() => Int, { nullable: true })
  sectorId: number;

  @Field(() => String, { nullable: true })
  expectation: string;

  @Field(() => [Int], { nullable: true })
  sdgIds: number[];

  @Field(() => String, { nullable: true })
  logoUrl: string;

  @Field(() => [Int], { nullable: true })
  targetGrades: number[];

  @Field(() => [String], { nullable: true })
  targetStudents: string[];
}
