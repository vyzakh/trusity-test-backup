import { UserScope } from '@shared/enums';

export class StudentMapper {
  static toStudent(row: any) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      contactNumber: row.contact_number,
      dateOfBirth: row.date_of_birth,
      schoolId: row.school_id,
      currentAYId: row.academic_year_id,
      gradeId: row.grade_id,
      sectionId: row.section_id,
      gradeName: row.grade_name,
      sectionName: row.section_name,
      userAccountId: row.user_account_id,
      accountType: row.account_type,
      avatarUrl: row.avatar_url,
      enrollmentStatus: row.enrollment_status_code,
      scope: UserScope.STUDENT,
      guardian: {
        name: row.guardian_name,
        email: row.guardian_email,
        contactNumber: row.guardian_contact_number,
      },
      schoolName: row.school_name,
    };
  }
  static toStudents(rows: any[]) {
    return rows.map(this.toStudent);
  }
  static toStudentIds(rows: any[]) {
    return rows.map((row) => this.toStudent(row).id);
  }
  static toStudentEnrollment(row: any) {
    return {
      schoolId: row.school_id,
      academicYearId: row.academic_year_id,
      studentId: row.student_id,
      gradeId: row.grade_id,
      sectionId: row.section_id,
      enrollmentDate: row.enrollment_date,
      enrollmentStatusId: row.enrollment_status_id,
      enrollmentStatusCode: row.enrollment_status_code,
      gradeName: row.grade_name,
      sectionName: row.section_name,
    };
  }

  static toStudentEnrollments(rows: any[]) {
    return rows.map(this.toStudentEnrollment);
  }
}
