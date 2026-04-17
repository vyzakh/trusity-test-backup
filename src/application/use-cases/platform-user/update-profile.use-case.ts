import { ICurrentUser } from '@core/types';
import { PlatformUserRepository, SchoolAdminRepository, StudentRepository, TeacherRepository, UserAccountRepository } from '@infrastructure/database';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { ForbiddenException } from '@nestjs/common';
import { UserScope } from '@shared/enums';
import { genTimestamp, sanitizeInput } from '@shared/utils';

interface UpdateProfileUseCaseInput {
  data: {
    name?: string;
    email?: string;
    contactNumber?: string;
    avatarUrl?: string | null;
  };
  user: ICurrentUser;
}

export class UpdateProfileUseCase {
  constructor(
    private readonly dependencies: {
      platformUserRepo: PlatformUserRepository;
      schoolAdminRepo: SchoolAdminRepository;
      studentRepo: StudentRepository;
      teacherRepo: TeacherRepository;
      sessionRepo: SessionRepository;
      userAccountRepo: UserAccountRepository;
    },
  ) {}

  async execute(input: UpdateProfileUseCaseInput) {
    const { platformUserRepo, schoolAdminRepo, studentRepo, teacherRepo, sessionRepo, userAccountRepo } = this.dependencies;
    const { data, user } = input;
    const isEmailChanging = data.email !== undefined && user.email !== sanitizeInput(data.email);

    if (data.email !== undefined) {
      const sanitizedEmail = sanitizeInput(data.email);

      if (user.email !== sanitizedEmail) {
        const existingUser = await userAccountRepo.getUserAccountByEmail({ email: sanitizedEmail });

        if (existingUser) {
          throw new ForbiddenException('The email address you entered is already in use. Please use a different email.');
        }
      }
    }
    const updateData: Record<string, any> = {
      updatedAt: genTimestamp().iso,
    };

    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl;
    }
    if (data.name !== undefined) {
      updateData.name = sanitizeInput(data.name);
    }
    if (data.email !== undefined) {
      updateData.email = sanitizeInput(data.email);
    }
    if (data.contactNumber !== undefined) {
      updateData.contactNumber = sanitizeInput(data.contactNumber);
    }
    let updatedProfile;

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        updatedProfile = await platformUserRepo.updatePlatformUser({
          platformUserId: user.id,
          ...updateData,
        });
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        updatedProfile = await schoolAdminRepo.updateSchoolAdmin({
          schoolAdminId: user.id,
          ...updateData,
        });
        break;
      }
      case UserScope.STUDENT: {
        if (data.name !== undefined || data.email !== undefined || data.contactNumber !== undefined) {
          throw new ForbiddenException('Students are only allowed to update avatar.');
        }
        updatedProfile = await studentRepo.updateStudent({
          studentId: user.id,
          ...updateData,
        });
        break;
      }
      case UserScope.TEACHER: {
        updatedProfile = await teacherRepo.updateTeacher({
          teacherId: user.id,
          ...updateData,
        });
        break;
      }
      default:
        throw new ForbiddenException('You are not allowed to perform this action.');
    }

    if (data.email !== undefined) {
      await userAccountRepo.updateUserAccount({
        userAccountId: user.userAccountId,
        email: sanitizeInput(data.email),
        updatedAt: genTimestamp().iso,
      });
    }

    if (isEmailChanging) {
      await sessionRepo.clearSession({
        userAccountId: user.userAccountId,
      });
    } else {
      await sessionRepo.updateUserProfileInSessions({
        userId: user.id,
        userScope: user.scope,
        updates: {
          ...(data.name !== undefined && { name: updatedProfile.name }),
          ...(data.contactNumber !== undefined && { contactNumber: updatedProfile.contactNumber }),
          ...(data.avatarUrl !== undefined && { avatarUrl: updatedProfile.avatarUrl }),
        },
      });
    }

    return updatedProfile;
  }
}
