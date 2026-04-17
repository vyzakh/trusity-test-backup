import { UserScope } from '@shared/enums';
import { BadRequestException } from '@shared/execeptions';
import { AppExceptionType } from '@shared/execeptions/base.exception';
import { isDefined } from '@shared/utils';
import { Knex } from 'knex';

export class UserAccountRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async createUserAccount(input: Record<string, any>) {
    try {
      const [userAccount] = await this.db('user_account').insert(
        {
          email: input.email,
          scope: input.scope,
        },
        '*',
      );

      return {
        id: userAccount.id,
        email: userAccount.email,
        scope: userAccount.scope,
        avatarUrl: userAccount.avatar_url,
        createdAt: userAccount.created_at,
        updatedAt: userAccount.updated_at,
      };
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'user_account_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.', {
            type: AppExceptionType.DUPLICATE_EMAIL,
          });
        }
      }

      throw error;
    }
  }

  async updateUserAccount(input: Record<string, any>) {
    try {
      const columnsForUpdate: Record<string, string> = {
        email: 'email',
        passwordResetToken: 'password_reset_token',
        passwordResetTokenExpAt: 'password_reset_token_exp_at',
        updatedAt: 'updated_at',
      };

      const data: Record<string, any> = {};
      for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
        if (isDefined(input[inputKey])) {
          data[dbKey] = input[inputKey];
        }
      }

      const query = this.db('user_account').update(data, '*');

      query.modify((qb) => {
        if (input.userAccountId) {
          qb.where({ id: input.userAccountId });
        }

        if (input.qEmail) {
          qb.where({ email: input.qEmail });
        }

        if (input.scope) {
          qb.where({ scope: input.scope });
        }
      });

      const [row] = await query;

      if (!row) return null;

      return {
        id: row.id,
        email: row.email,
        scope: row.scope,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'user_account_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.');
        }
      }

      throw error;
    }
  }

  async createUserAuth(input: Record<string, any>) {
    await this.db('user_auth').insert({
      user_account_id: input.userAccountId,
      password_hash: input.passwordHash,
      password_salt: input.passwordSalt,
    });
  }

  async deleteUserAccount(input: Record<string, any>) {
    await this.db('user_account').del().where({ id: input.userAccountId });
  }

  async getUserAccountByEmail(input: Record<string, any>) {
    const [userAccount] = await this.db('user_account').select('*').where({
      email: input.email,
    });

    if (!userAccount) {
      return null;
    }

    return {
      id: userAccount.id,
      email: userAccount.email,
      scope: userAccount.scope,
      avatarUrl: userAccount.avatar_url,
      createdAt: userAccount.created_at,
      updatedAt: userAccount.updated_at,
    };
  }

  async getUserAccount(input: Record<string, any>) {
    const query = this.db('user_account').select('*');

    if (isDefined(input.userAccountId)) {
      query.where({ id: input.userAccountId });
    }
    if (isDefined(input.email)) {
      query.where({ email: input.email });
    }
    if (isDefined(input.passwordResetToken)) {
      query.where({ password_reset_token: input.passwordResetToken });
    }

    const [row] = await query;

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      scope: row.scope,
      passwordResetToken: row.password_reset_token,
      passwordResetTokenExpAt: row.password_reset_token_exp_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getUserAuthByAccountId(input: Record<string, any>) {
    const [userAuth] = await this.db('user_auth').select('*').where({
      user_account_id: input.userAccountId,
    });

    if (!userAuth) {
      return null;
    }

    return {
      passwordSalt: userAuth.password_salt,
      passwordHash: userAuth.password_hash,
    };
  }

  async getPlatformUserByAccountId(input: Record<string, any>) {
    const [platformUser] = await this.db('platform_user as pu').select(['pu.*']).where({ user_account_id: input.userAccountId });

    if (!platformUser) return null;

    return {
      id: platformUser.id,
      name: platformUser.name,
      email: platformUser.email,
      scope: UserScope.PLATFORM_USER,
      userAccountId: platformUser.user_account_id,
      role: platformUser.role,
      canDelete: platformUser.can_delete,
    };
  }

  async getSchoolAdminUserByAccountId(input: Record<string, any>) {
    const [schoolAdmin] = await this.db('school_admin as sa').select(['sa.*']).where({ user_account_id: input.userAccountId });

    if (!schoolAdmin) return null;

    return {
      id: schoolAdmin.id,
      name: schoolAdmin.name,
      email: schoolAdmin.email,
      scope: UserScope.SCHOOL_ADMIN,
      contactNumber: schoolAdmin.contact_number,
      userAccountId: schoolAdmin.user_account_id,
      isPrimary: schoolAdmin.is_primary,
      schoolId: schoolAdmin.school_id,
    };
  }

  async getTeacherUserByAccountId(input: Record<string, any>) {
    const [teacher] = await this.db('teacher as t').select(['t.*']).where({ user_account_id: input.userAccountId });

    if (!teacher) return null;

    const teacherSections = await this.db('teacher_section as ts')
      .join('school_section as ss', 'ss.section_id', 'ts.section_id')
      .select(['ts.section_id', 'ss.grade_id'])
      .where({ 'ts.teacher_id': teacher.id });

    const schoolSectionIds = [...new Set(teacherSections.map((s) => s.section_id))];
    const schoolGradeIds = [...new Set(teacherSections.map((s) => s.grade_id))];

    return {
      id: teacher.id,
      contactNumber: teacher.contact_number,
      name: teacher.name,
      email: teacher.email,
      scope: UserScope.TEACHER,
      userAccountId: teacher.user_account_id,
      schoolId: teacher.school_id,
      schoolGradeIds,
      schoolSectionIds,
    };
  }

  async updateUserAuth(input: Record<string, any>) {
    const columnsForUpdate: Record<string, string> = {
      passwordSalt: 'password_salt',
      passwordHash: 'password_hash',
    };

    const data: Record<string, any> = { updated_at: input.updatedAt };
    for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
      if (isDefined(input[inputKey])) {
        data[dbKey] = input[inputKey];
      }
    }

    await this.db('user_auth').update(data, '*').where({ user_account_id: input.userAccountId });
  }
}
