import { LoginUseCase } from '@application/use-cases';
import {
  DatabaseService,
  PlatformUserRepository,
  SchoolAdminRepository,
  SchoolRepository,
  StudentRepository,
  TeacherRepository,
  UserAccountRepository,
} from '@infrastructure/database';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { LoginSchema } from '@presentation/graphql/modules/auth/schemas';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly dbService: DatabaseService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(username: string, password: string) {
    const validation = LoginSchema.safeParse({
      email: username,
      password,
    });
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
        teacherRepo: new TeacherRepository(db),
        studentRepo: new StudentRepository(db),
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ userAccountRepo, platformUserRepo, schoolAdminRepo, teacherRepo, studentRepo, schoolRepo }) => {
        const useCase = new LoginUseCase({
          userAccountRepo,
          platformUserRepo,
          schoolAdminRepo,
          teacherRepo,
          studentRepo,
          schoolRepo,
        });

        return await useCase.execute({
          data: validation.data,
        });
      },
    });
  }
}
