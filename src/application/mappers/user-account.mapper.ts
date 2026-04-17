import { UserAccount } from '@domain/entities/user-account';

export class UserAccountMapper {
  static toEntity(row: any): UserAccount {
    return new UserAccount({
      id: row.id,
      email: row.email,
      scope: row.scope,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toRow(input: Record<string, any>) {
    return {
      name: input.name,
      email: input.email,
      contact_number: input.contactNumber,
      date_of_birth: input.dateOfBirth,
      scope: input.scope,
    };
  }
}
