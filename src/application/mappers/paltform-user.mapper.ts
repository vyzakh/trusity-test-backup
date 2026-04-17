import { UserScope } from '@shared/enums';

export class PlatformUserMapper {
  static toPlatformUser(row: any) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatar_url,
      scope: UserScope.PLATFORM_USER,
      userAccountId: row.user_account_id,
      role: row.role,
      canDelete: row.can_delete,
    };
  }
  static toPlatformUsers(rows: any[]) {
    return rows.map(this.toPlatformUser);
  }
  static toPlatformUserPermission(row: any) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
    };
  }
  static toPlatformUserPermissions(rows: any[]) {
    return rows.map(this.toPlatformUserPermission);
  }
}
