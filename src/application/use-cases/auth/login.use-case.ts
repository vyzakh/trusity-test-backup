import { PlatformUserRepository, SchoolAdminRepository, SchoolRepository, StudentRepository, TeacherRepository, UserAccountRepository } from '@infrastructure/database';
import { PlatformUserRole, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { UnauthenticatedException } from '@shared/execeptions';
import { verifyPassword } from '@shared/utils';

interface LoginUseCaseInput {
  data: {
    email: string;
    password: string;
  };
}

export class LoginUseCase {
  constructor(
    private readonly dependencies: {
      platformUserRepo: PlatformUserRepository;
      userAccountRepo: UserAccountRepository;
      schoolAdminRepo: SchoolAdminRepository;
      teacherRepo: TeacherRepository;
      studentRepo: StudentRepository;
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute(input: LoginUseCaseInput) {
    const { platformUserRepo, schoolRepo, userAccountRepo, schoolAdminRepo, teacherRepo, studentRepo } = this.dependencies;
    const { data } = input;

    const userAccount = await userAccountRepo.getUserAccountByEmail({
      email: data.email,
    });

    if (!userAccount) {
      throw new UnauthenticatedException('We couldn’t find an account with that email and password. Please check your credentials and try again.');
    }

    const userAuth = await userAccountRepo.getUserAuthByAccountId({
      userAccountId: userAccount.id,
    });

    if (!userAuth) {
      throw new UnauthenticatedException('We couldn’t find an account with that email and password. Please check your credentials and try again.');
    }

    const isPasswordVerified = verifyPassword({
      password: data.password,
      salt: userAuth.passwordSalt,
      hash: userAuth.passwordHash,
    });

    if (!isPasswordVerified) {
      throw new UnauthenticatedException('We couldn’t find an account with that email and password. Please check your credentials and try again.');
    }

    const checkSchoolActive = async (schoolId: string) => {
      const school = await schoolRepo.getSchool({ schoolId });

      if (!school || !school.isActive) {
        throw new UnauthenticatedException('Your school account has been deactivated. Please contact the administrator for assistance.');
      }
    };

    switch (userAccount.scope) {
      case UserScope.PLATFORM_USER: {
        const platformUser = await platformUserRepo.getPlatformUser({
          userAccountId: userAccount.id,
        });

        if (!platformUser) {
          throw new UnauthenticatedException('We couldn’t find an account with that email and password. Please check your credentials and try again.');
        }

        let permissionCodes: any[] = [];

        if (platformUser.role === PlatformUserRole.USER) {
          const permissions = await platformUserRepo.getPermissions({
            platformUserId: platformUser.id,
          });

          permissionCodes = permissions.map((permission) => permission.code);
        }

        return {
          ...platformUser,
          permissions: permissionCodes,
        };
      }
      case UserScope.SCHOOL_ADMIN: {
        const schoolAdmin = await schoolAdminRepo.getSchoolAdmin({
          userAccountId: userAccount.id,
        });

        if (!schoolAdmin) {
          throw new UnauthenticatedException('We couldn’t find an account with that email and password. Please check your credentials and try again.');
        }

        await checkSchoolActive(schoolAdmin.schoolId);

        return schoolAdmin;
      }
      case UserScope.TEACHER: {
        const teacher = await teacherRepo.getTeacher({
          userAccountId: userAccount.id,
        });

        if (!teacher) {
          throw new UnauthenticatedException('We couldn’t find an account with that email and password. Please check your credentials and try again.');
        }

        await checkSchoolActive(teacher.schoolId);

        const teacherGradeSectionList = await teacherRepo.getTeacherGradeSectionList({
          teacherId: teacher.id,
          schoolId: teacher.schoolId,
        });

        return {
          ...teacher,
          classAssignments: teacherGradeSectionList,
        };
      }
      case UserScope.STUDENT: {
        const studentCurrentEnrollment = await studentRepo.getEnrollment({
          userAccountId: userAccount.id,
          enrollmentStatuses: [EnrollmentStatusEnum.ACTIVE, EnrollmentStatusEnum.GRADUATED],
        });

        if (!studentCurrentEnrollment) {
          throw new UnauthenticatedException('We couldn’t find an account with that email and password. Please check your credentials and try again.');
        }

        await checkSchoolActive(studentCurrentEnrollment.schoolId);

        if (studentCurrentEnrollment.enrollmentStatus === EnrollmentStatusEnum.GRADUATED) {
          throw new UnauthenticatedException('Your account is no longer active. Please contact the administration if you think this is an error.');
        }

        return await studentRepo.getStudentUser({
          userAccountId: userAccount.id,
          enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
        });
      }
      default: {
        throw new UnauthenticatedException(
          'Your account does not have the necessary permissions to access this feature. If you believe this is an error, please contact support or your system administrator for assistance.',
        );
      }
    }
  }
}
