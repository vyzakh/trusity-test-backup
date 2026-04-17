import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { ChallengeVisibility } from '@shared/enums';

@InputType()
export class CreateChallengeInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  companyName: string;

  @Field(() => Int)
  sectorId: number;

  @Field(() => String)
  description: string;

  @Field(() => ChallengeVisibility)
  visibility: ChallengeVisibility;

  @Field(() => String)
  expectation: string;

  @Field(() => [Int])
  sdgIds: number[];

  @Field(() => String, { nullable: true })
  logoUrl: string;

  @Field(() => [Int], { nullable: true })
  targetGrades: number[];

  @Field(() => [String], { nullable: true })
  targetStudents: string[];
}

@ArgsType()
export class CreateChallengeArgs {
  @Field(() => CreateChallengeInput)
  input: CreateChallengeInput;
}
