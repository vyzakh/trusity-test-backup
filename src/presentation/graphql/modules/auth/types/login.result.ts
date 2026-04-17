import { createUnionType, Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { UserScope } from '@shared/enums';
import { PlatformUser } from '../../common/types';
import { SchoolAdmin } from '../../common/types/school-admin-user.type';
import { Student } from '../../student/types';
import { Teacher } from '../../teacher/types';

export const LoggedInUserUnion = createUnionType({
  name: 'LoggedInUserUnion',
  types: () => {
    return [PlatformUser, SchoolAdmin, Teacher, Student] as const;
  },
  resolveType(value) {
    switch (value.scope) {
      case UserScope.PLATFORM_USER: {
        return PlatformUser;
      }
      case UserScope.SCHOOL_ADMIN: {
        return SchoolAdmin;
      }
      case UserScope.TEACHER: {
        return Teacher;
      }
      case UserScope.STUDENT: {
        return Student;
      }
    }
  },
});

@ObjectType()
export class LoginResult extends BaseResult {
  @Field(() => LoggedInUserUnion, { nullable: true })
  user: typeof LoggedInUserUnion;
}
