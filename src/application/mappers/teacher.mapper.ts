import { UserScope } from '@shared/enums';
import { genTimestamp, isDefined } from '@shared/utils';

export class TeacherMapper {
  static toTeacher(row: any) {
    return {
      id: row.id,
      userAccountId: row.user_account_id,
      schoolId: row.school_id,
      name: row.name,
      email: row.email,
      contactNumber: row.contact_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      scope: UserScope.TEACHER,
      avatarUrl: row.avatar_url,
      currentSchoolAYId: row.current_ay_id,
    };
  }
  static toTeachers(rows: any[]) {
    return rows.map(this.toTeacher);
  }

  static toTeacherGrade(row: any) {
    return {
      grade: {
        id: row.id,
        name: row.name,
      },
      schoolId: row.schoolId,
      teacherId: row.teacher_id,
    };
  }
  static toTeacherGrades(rows: any[]) {
    return rows.map(this.toTeacherGrade);
  }
  static toTeacherGradeSection(row: any) {
    return {
      section: {
        id: row.id,
        name: row.name,
      },
      schoolId: row.school_id,
      gradeId: row.grade_id,
      teacherId: row.teacher_id,
    };
  }
  static toTeacherGradeSections(rows: any[]) {
    return rows.map(this.toTeacherGradeSection);
  }

  static toTeacherGradeSectionList(rows: any[]) {
    return rows.map((row) => [row.grade_id, row.section_id]) as [number, number][];
  }

  static toEntity(row: any) {
    return {
      teacherId: row.teacher_id,
      schoolId: row.user_account_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }

  static toRow(input: any) {
    return {
      teacher_id: input.teacherId,
      school_id: input.schoolId,
    };
  }

  static toPartialRow(input: Record<string, any>) {
    const partialRow = { updated_at: genTimestamp().iso };

    if (isDefined(input.name)) {
      partialRow['name'] = input.name;
    }
    if (isDefined(input.email)) {
      partialRow['email'] = input.email;
    }
    if (isDefined(input.contactNumber)) {
      partialRow['contact_number'] = input.contactNumber;
    }

    return partialRow;
  }
}

export class TeacherGradeMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      grade: row.grade,
      schoolId: row.school_id,
      teacherId: row.teacher_id,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }

  static toRow(input: Record<string, any>) {
    return {
      teacher_id: input.teacherId,
      school_id: input.schoolId,
      grade_id: input.gradeId,
    };
  }

  static toRowList(input: Record<string, any>[]) {
    return input.map(this.toRow);
  }
}

export class TeacherGradeSectionMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      section: row.section,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }

  static toRow(input: Record<string, any>) {
    return {
      teacher_id: input.teacherId,
      school_grade_section_id: input.schoolGradeSectionId,
    };
  }

  static toRowList(input: Record<string, any>[]) {
    return input.map(this.toRow);
  }
}
