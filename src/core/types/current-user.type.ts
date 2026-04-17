import { PlatformUserRole, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';

type ICurrentUserBase = {
  id: string;
  userAccountId: string;
  email: string;
  name: string;
};

export type ICurrentStudentUser = ICurrentUserBase & {
  scope: UserScope.STUDENT;
  schoolId: string;
  gradeId: string;
  sectionId: string;
  gradeName: string;
  sectionName: string;
  currentAYId: string;
  enrollmentStatusId: number;
  enrollmentStatusCode: EnrollmentStatusEnum;
};

export type ICurrentTeacherUser = ICurrentUserBase & {
  scope: UserScope.TEACHER;
  schoolId: string;
  classAssignments: [number, number][];
  currentSchoolAYId: string;
};

export type ICurrentSchoolAdminUser = ICurrentUserBase & {
  scope: UserScope.SCHOOL_ADMIN;
  schoolId: string;
  currentSchoolAYId: string;
};

export type ICurrentPlatformUser = ICurrentUserBase & {
  scope: UserScope.PLATFORM_USER;
  role: PlatformUserRole;
  canDelete: boolean;
  permissions: string[];
  schoolId?: undefined;
};

export type ICurrentUser = ICurrentStudentUser | ICurrentTeacherUser | ICurrentSchoolAdminUser | ICurrentPlatformUser;
