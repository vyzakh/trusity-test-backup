export class CountryMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class StateMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class CityMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class GradeMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      grade: row.grade,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class SectionMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      section: row.section,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class SdgMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class CurrencyMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class CurriculumMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      name: row.name,
      allowCustom: row.allow_custom,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class ChallengeSectorMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class TemplateMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      code: row.code,
      templateUrl: row.template_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }
}

export class CommonMapper {
  static toEnrollmentStatus(row: any) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
    };
  }
  static toEnrollmentStatuses(rows: any[]) {
    return rows.map(this.toEnrollmentStatus);
  }
  static toAcademicYear(row: any) {
    return {
      id: row.id,
      schoolId: row.school_id,
      startYear: row.start_year,
      endYear: row.end_year,
      startDate: row.start_date,
      endDate: row.end_date,
    };
  }

  static toGrade(row: any) {
    return {
      id: row.id,
      name: row.name,
      rank: row.rank,
    };
  }
  static toGrades(rows: any[]) {
    return rows.map(this.toGrade);
  }
  static toSection(row: any) {
    return {
      id: row.id,
      name: row.name,
    };
  }

  static toAiPerformanceFeedback(row: any) {
    return {
      id: row.id,
      feedback: row.feedback,
    };
  }
}
