import { SchoolAdminMapper } from '@application/mappers';
import { UserScope } from '@shared/enums';
import { BadRequestException } from '@shared/execeptions';
import { applyOffsetPagination, isDefined } from '@shared/utils';
import { Knex } from 'knex';

export class SchoolAdminRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async createSchoolAdmin(input: Record<string, any>) {
    try {
      const [row] = await this.db('school_admin').insert(
        {
          name: input.name,
          email: input.email,
          contact_number: input.contactNumber,
          school_id: input.schoolId,
          user_account_id: input.userAccountId,
          is_primary: input.isPrimary,
          created_by: input.createdBy,
        },
        '*',
      );

      return SchoolAdminMapper.toSchoolAdmin(row);
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'school_admin_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.');
        }
      }

      throw error;
    }
  }
  async updateSchoolAdmin(input: Record<string, any>) {
    try {
      const columnsForUpdate: Record<string, string> = {
        name: 'name',
        email: 'email',
        contactNumber: 'contact_number',
        avatarUrl: 'avatar_url',
        updatedAt: 'updated_at',
      };

      const data: Record<string, any> = {};

      for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
        if (isDefined(input[inputKey])) {
          data[dbKey] = input[inputKey];
        }
      }

      const query = this.db('school_admin').update(data, '*').where({
        id: input.schoolAdminId,
      });

      query.modify((qb) => {
        if (isDefined(input.schoolId)) {
          qb.where({ school_id: input.schoolId });
        }

        if (isDefined(input.isPrimary)) {
          qb.where({ is_primary: input.isPrimary });
        }

        if (isDefined(input.schoolAdminId)) {
          qb.where({ id: input.schoolAdminId });
        }
      });

      const [row] = await query;

      if (!row) return null;

      return SchoolAdminMapper.toSchoolAdmin(row);
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'school_admin_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.');
        }
      }

      throw error;
    }
  }
  async getSchoolAdmin(input: Record<string, any>) {
    const query = this.db('school_admin').join('school', 'school_admin.school_id', '=', 'school.id').select(['school_admin.*', 'school.current_ay_id']);

    query.modify((qb) => {
      if (isDefined(input.schoolAdminId)) {
        qb.where({ id: input.schoolAdminId });
      }

      if (isDefined(input.schoolId)) {
        qb.where({ school_id: input.schoolId });
      }

      if (isDefined(input.userAccountId)) {
        qb.where({ user_account_id: input.userAccountId });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return SchoolAdminMapper.toSchoolAdmin(row);
  }

  async getSchoolAdminById(input: Record<string, any>) {
    const query = this.db('school_admin').select(['*']).where({ id: input.schoolAdminId });

    if (isDefined(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }

    const [row] = await query;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      contactNumber: row.contact_number,
      schoolId: row.school_id,
      isPrimary: row.isPrimary,
      scope: UserScope.SCHOOL_ADMIN,
      userAccountId: row.user_account_id,
    };
  }

  async getSchoolAdmins(input: Record<string, any>) {
    const query = this.db('school_admin as schadm').select(['schadm.*']);

    this.applySchoolAdminFilters(query, input);

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;

    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        contactNumber: row.contact_number,
        schoolId: row.school_id,
        userAccountId: row.user_account_id,
        isPrimary: row.is_primary,
        scope: UserScope.SCHOOL_ADMIN,
      };
    });
  }

  async countSchoolAdmins(input: Record<string, any>) {
    const query = this.db('school_admin as schadm').count('schadm.id as count');

    this.applySchoolAdminFilters(query, input);

    const [{ count }] = await query;

    return parseInt(count as string);
  }

  async deleteSchoolAdmin(input: Record<string, any>) {
    const query = this.db('school_admin').del().where({ id: input.schoolAdminId });

    if (isDefined(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }
    if (isDefined(input.isPrimary)) {
      query.where({ is_primary: input.isPrimary });
    }

    await query;
  }

  applySchoolAdminFilters(query: Knex.QueryBuilder, input: Record<string, any>) {
    if (input.name) {
      const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      const regex = `.*${safeRegex}.*`;
      query.whereRaw(`schadm.name ~* ?`, [regex]);
    }

    if (input.schoolId) {
      query.where({ 'schadm.school_id': input.schoolId });
    }

    if (input.excludeUserAccountIds) {
      query.whereNotIn('schadm.user_account_id', input.excludeUserAccountIds);
    }
  }
}
