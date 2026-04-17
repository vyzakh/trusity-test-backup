import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@ObjectType()
export class BusinessLearningPhase {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  sortOrder: number;
}

@ObjectType()
export class BusinessLearningStep {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  sortOrder: number;

  gradeId: number;
}

@ObjectType()
export class BusinessLearningContent {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  businessLearningStepId: number;

  @Field(() => Int)
  gradeId: number;

  @Field(() => String, { nullable: true })
  fileUrl: string;

  @Field(() => String, { nullable: true })
  mimeType: string;

  @Field(() => Int)
  sortOrder: number;
}

@ObjectType()
export class CreateBusinessLearningContentResult extends BaseResult {
  @Field(() => [BusinessLearningContent])
  businessLearningContent: BusinessLearningContent[];
}

@ObjectType()
export class DeleteBusinessLearningContentResult extends BaseResult {}

@InputType()
export class CreateBusinessLearningContentInput {
  @Field(() => Int)
  businessLearningStepId: number;

  @Field(() => [Int], { nullable: true })
  gradeIds: number[];

  @Field(() => [String])
  fileKeys: string[];

  @Field(() => Int, { nullable: true })
  sortOrder: number;
}

@InputType()
export class UpdateBusinessLearningContentOrdersInput {
  @Field(() => Int)
  businessLearningContentId: number;

  @Field(() => Int)
  sortOrder: number;
}

@ArgsType()
export class DeleteBusinessLearningContentArgs {
  @Field(() => Int)
  businessLearningContentId: number;
}

@ArgsType()
export class BusinessLearningContentsArgs {
  @Field()
  phaseCode: string;

  @Field()
  stepCode: string;

  @Field(() => Int, { nullable: true })
  gradeId: number;
}
