import { ArgsType, Field } from '@nestjs/graphql';
import { BusinessModelEnum } from '@shared/enums';

@ArgsType()
export abstract class ToatalStudentsArgs {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => BusinessModelEnum, { nullable: true })
  accountType: BusinessModelEnum;

  @Field(() => String, { nullable: true })
  schoolGradeId: string;

  @Field(() => String, { nullable: true })
  schoolSectionId: string;

  @Field(() => String, { nullable: true })
  teacherId: string;
}
