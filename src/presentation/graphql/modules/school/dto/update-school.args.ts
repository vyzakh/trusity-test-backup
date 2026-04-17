import { Field, GraphQLISODateTime, InputType, Int } from '@nestjs/graphql';
import { BusinessModelEnum } from '@shared/enums';

@InputType()
class UpdateSchoolCurriculumInput {
  @Field(() => Int)
  id: number;

  @Field(() => String, { nullable: true })
  name: string;
}

@InputType()
class UpdateSchoolAddressInput {
  @Field(() => String, { nullable: true })
  countryId: string;

  @Field(() => String, { nullable: true })
  stateId: string;

  @Field(() => String, { nullable: true })
  cityId: string;

  @Field(() => String, { nullable: true })
  streetAddressLine1: string;

  @Field(() => String, { nullable: true })
  streetAddressLine2: string;

  @Field(() => String, { nullable: true })
  postalCode: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;
}

@InputType()
class UpdateSchoolContactInput {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;

  @Field(() => String, { nullable: true })
  email: string;
}

@InputType()
export class UpdateSchoolInput {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => BusinessModelEnum)
  accountType: BusinessModelEnum;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => Int, { nullable: true })
  academicStartMonth: number;

  @Field(() => Int, { nullable: true })
  academicEndMonth: number;

  @Field(() => Int, { nullable: true })
  promotionStartMonth: number;

  @Field(() => Int, { nullable: true })
  promotionStartDay: number;

  @Field(() => [UpdateSchoolCurriculumInput], { nullable: true })
  curriculums: UpdateSchoolCurriculumInput[];

  @Field(() => Int, { nullable: true })
  totalLicense: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  licenseExpiry: Date;

  @Field(() => UpdateSchoolAddressInput, { nullable: true })
  address: UpdateSchoolAddressInput;

  @Field(() => String, { nullable: true })
  principalName: string;

  @Field(() => UpdateSchoolContactInput, { nullable: true })
  contact: UpdateSchoolContactInput;

  @Field(() => String, { nullable: true })
  logoUrl: string;
}
