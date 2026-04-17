import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { SchoolAdmin } from '../../common/types/school-admin-user.type';

@ObjectType()
export class CreateSchoolAdminResult extends BaseResult {
  @Field(() => SchoolAdmin)
  schoolAdmin: SchoolAdmin;
}

@ObjectType()
export class DeleteSchoolAdminResult extends BaseResult {}

@ObjectType()
export class UpdateSchoolAdminResult extends BaseResult {
  @Field(() => SchoolAdmin)
  schoolAdmin: SchoolAdmin;
}
