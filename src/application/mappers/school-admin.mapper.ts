import { UserScope } from '@shared/enums';

export class SchoolAdminMapper {
  static toSchoolAdmin(row: any) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      contactNumber: row.contact_number,
      schoolId: row.school_id,
      isPrimary: row.is_primary,
      avatarUrl: row.avatar_url,
      scope: UserScope.SCHOOL_ADMIN,
      userAccountId: row.user_account_id,
      currentSchoolAYId: row.current_ay_id,
    };
  }
  static toSchoolAdmins(rows: any[]) {
    return rows.map(this.toSchoolAdmin);
  }
}
