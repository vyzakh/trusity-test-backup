import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class ToggleBusinessPhaseLockInput {
  @Field(() => String, { nullable: true })
  schoolId?: string;

  @Field(() => Int, { nullable: true })
  gradeId?: number;

  @Field(() => Int, { nullable: true })
  sectionId?: number;

  @Field(() => [String], { nullable: true })
  studentIds?: string[];

  @Field(() => [BusinessPhase])
  businessPhase!: BusinessPhase[];
}

@InputType()
export class BusinessPhase {
  @Field(() => String)
  phase!: string;

  @Field(() => Boolean)
  is_locked!: boolean;
}

@ObjectType()
export class BusinessPhaseLockStatus {
  @Field(() => String)
  phase: string;

  @Field(() => Boolean)
  is_locked: boolean;
}

@ArgsType()
export class BusinessPhaseLockStatusArgs {
  @Field(() => String, { nullable: true })
  schoolId?: string;

  @Field(() => Int, { nullable: true })
  gradeId?: number;

  @Field(() => Int, { nullable: true })
  sectionId?: number;

  @Field(() => [String], { nullable: true })
  studentIds: string[];
}
