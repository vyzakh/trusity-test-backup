import { UserScope } from "@shared/enums";

export class ChallengeMapper {
  static toChallenge(row: any) {
    return {
      id: row.id,
      title: row.title,
      sdgIds: row.sdg_ids,
      description: row.description,
      visibility: row.visibility,
      expectation: row.expectation,
      companyName: row.company_name,
      scope: row.scope,
      creatorType: row.creator_type,
      schoolId: row.school_id,
      createdBy: row.created_by,
      sectorId: row.sector_id,
      logoUrl: row.logo_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toRow(input: any) {
    return {
      title: input.title,
      company_name: input.companyName,
      sector_id: input.sectorId,
      description: input.description,
      creator_type: input.creatorType,
      logo_url: input.logoUrl,
    };
  }

  static toEntity(row: any) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      companyName: row.company_name,
      creatorType: row.creator_type,
      sectorId: row.sector_id,
      logoUrl: row.logo_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }

  static toChallengeTargetGrade(row: any) {
    return {
      grade: {
        id: row.grade_id,
        name: row.grade_name,
      },
      challengeId: row.challenge_id,
    };
  }

  static toChallengeTargetSection(row: any) {
    return {
      section: {
        id: row.section_id,
        name: row.section_name,
      },
      challengeId: row.challenge_id,
      gradeId: row.grade_id,
    };
  }

  static toChallengeTargetStudent(row: any) {
    return {
      student: {
        id: row.id,
        name: row.name,
        email: row.email,
        contactNumber: row.contact_number,
        dateOfBirth: row.date_of_birth,
        schoolId: row.school_id,
        currentAYId: row.current_ay_id,
        gradeId: row.grade_id,
        sectionId: row.section_id,
        gradeName: row.grade_name,
        sectionName: row.section_name,
        userAccountId: row.user_account_id,
        accountType: row.account_type,
        avatarUrl: row.avatar_url,
        scope: UserScope.STUDENT,
        guardian: {
          name: row.guardian_name,
          email: row.guardian_email,
          contactNumber: row.guardian_contact_number,
        },
      },
    };
  }

  static toChallengeTargetGrades(rows: any[]) {
    return rows.map(this.toChallengeTargetGrade);
  }

  static toChallengeTargetSections(rows: any[]) {
    return rows.map(this.toChallengeTargetSection);
  }

  static toChallengeTargetStudents(rows: any[]) {
    return rows.map(this.toChallengeTargetStudent);
  }
}

export class ChallengeSdgMapper {
  static toRow(input: any) {
    return {
      challenge_id: input.challengeId,
      sdg_id: input.sdgId,
    };
  }

  static toRowList(inputs: any[]) {
    return inputs.map(this.toRow);
  }
}

export class PlatformChallengeMapper {
  static toRow(input: any) {
    return {
      challenge_id: input.challengeId,
      created_by: input.createdBy,
    };
  }

  toEntity(row: any) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      companyName: row.company_name,
      creatorType: row.creator_type,
      ...(row.sector_id && {
        sector: {
          id: row.sector_id,
          name: row.sector_name,
        },
      }),
      createdBy: {
        id: row.created_by_id,
        user_account_id: row.created_by_user_account_id,
        name: row.created_by_name,
        scope: row.created_by_scope,
        email: row.created_by_email,
      },
      logoUrl: row.logo_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
