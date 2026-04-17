import { PlatformUserMapper } from '@application/mappers';
import { UserScope } from '@shared/enums';
import { BadRequestException } from '@shared/execeptions';
import { applyOffsetPagination, isDefined, isDefinedStrict } from '@shared/utils';
import { Knex } from 'knex';

export class PlatformUserRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async getPlatformUser(input: Record<string, any>) {
    const query = this.db('platform_user as pu').select(['pu.*']);

    if (isDefinedStrict(input.platformUserId)) {
      query.where({ 'pu.id': input.platformUserId });
    }
    if (isDefinedStrict(input.userAccountId)) {
      query.where({ 'pu.user_account_id': input.userAccountId });
    }

    const [row] = await query;

    if (!row) return null;

    return PlatformUserMapper.toPlatformUser(row);
  }

  async getPlatformUserByAccountId(input: Record<string, any>) {
    const [platformUser] = await this.db('platform_user as pu').select(['pu.*']).where({ user_account_id: input.userAccountId });

    if (!platformUser) return null;

    return { id: platformUser.id, name: platformUser.name, email: platformUser.email, scope: UserScope.PLATFORM_USER, userAccountId: platformUser.user_account_id };
  }

  async createPlatformUser(input: Record<string, any>) {
    try {
      const [platformUser] = await this.db('platform_user').insert(
        { user_account_id: input.userAccountId, name: input.name, email: input.email, contact_number: input.contactNumber },
        '*',
      );

      return {
        id: platformUser.id,
        name: platformUser.name,
        email: platformUser.email,
        scope: UserScope.PLATFORM_USER,
        userAccountId: platformUser.user_account_id,
      };
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'platform_user_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.');
        }
      }

      throw error;
    }
  }

  async deletePermissions(input: Record<string, any>) {
    await this.db('platform_user_permission').del().where({ platform_user_id: input.platformUserId });
  }

  async assignPermissions(input: Record<string, any>) {
    const data = input.permissionIds.map((permissionId: number) => {
      return { platform_user_id: input.platformUserId, permission_id: permissionId };
    });

    await this.db('platform_user_permission').insert(data);
  }

  async getPermissions(input: Record<string, any>) {
    const query = this.db('platform_user_permission as pup').join('permission as p', 'p.id', 'pup.permission_id').select(['p.*']).orderBy('p.sort_order', 'asc');

    if (isDefinedStrict(input.platformUserId)) {
      query.where({ 'pup.platform_user_id': input.platformUserId });
    }

    const rows = await query;

    return PlatformUserMapper.toPlatformUserPermissions(rows);
  }

  async getPlatformUserById(input: Record<string, any>) {
    const query = this.db('platform_user as pusr').select(['pusr.*']).where({ id: input.platformUserId });

    const [row] = await query;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      contactNumber: row.contact_number,
      scope: UserScope.PLATFORM_USER,
      role: row.role,
      canDelete: row.can_delete,
      userAccountId: row.user_account_id,
    };
  }

  async updatePlatformUser(input: Record<string, any>) {
    try {
      const columnsForUpdate: Record<string, string> = {
        name: 'name',
        email: 'email',
        contactNumber: 'contact_number',
        avatarUrl: 'avatar_url',
      };

      const data: Record<string, any> = { updated_at: input.updatedAt };
      for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
        if (isDefined(input[inputKey])) {
          data[dbKey] = input[inputKey];
        }
      }

      const query = this.db('platform_user').update(data, '*');

      if (isDefined(input.platformUserId)) {
        query.where({ id: input.platformUserId });
      }
      if (isDefined(input.userAccountId)) {
        query.where({ user_account_id: input.userAccountId });
      }

      const [row] = await query;

      if (!row) return null;

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        contactNumber: row.contact_number,
        scope: UserScope.PLATFORM_USER,
        role: row.role,
        avatarUrl: row.avatar_url,
        canDelete: row.can_delete,
        userAccountId: row.user_account_id,
      };
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'platform_user_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.');
        }
      }

      throw error;
    }
  }

  async deletePlatformUser(input: Record<string, any>) {
    const query = this.db('platform_user').del();

    if (isDefined(input.platformUserId)) {
      query.where({ id: input.platformUserId });
    }

    await query;
  }

  async getPlatformUsers(input: Record<string, any>) {
    const query = this.db('platform_user as pusr').select(['pusr.*']);

    query.modify((qb) => {
      if (input.permissionCodes && input.permissionCodes.length > 0) {
        qb.where((subQb) => {
          subQb
            .where('pusr.role', 'superadmin')
            .orWhereIn('pusr.id', function () {
              this.select('pup.platform_user_id')
                .from('platform_user_permission as pup')
                .join('permission as perm', 'perm.id', 'pup.permission_id')
                .whereIn('perm.code', input.permissionCodes)
                .groupBy('pup.platform_user_id')
                .havingRaw('COUNT(DISTINCT perm.code) = ?', [input.permissionCodes.length]);
            });
        });
      }
    });

    this.applyPlatformUserFilters(query, input);

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      contactNumber: row.contact_number,
      scope: UserScope.PLATFORM_USER,
      role: row.role,
      canDelete: row.can_delete,
      userAccountId: row.user_account_id,
    }));
  }

  async countPlatformUsers(input: Record<string, any>) {
    const query = this.db('platform_user as pusr').count('pusr.id as count');

    this.applyPlatformUserFilters(query, input);

    const [{ count }] = await query;

    return parseInt(count as string);
  }

  applyPlatformUserFilters(query: Knex.QueryBuilder, input: Record<string, any>) {
    if (input.name) {
      const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      const regex = `.*${safeRegex}.*`;
      query.whereRaw(`pusr.name ~* ?`, [regex]);
    }

    if (input.excludeUserAccountIds) {
      query.whereNotIn('pusr.user_account_id', input.excludeUserAccountIds);
    }
  }
}
