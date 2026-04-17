import { UserScope } from '@shared/enums';

export class EnrollmentMapper {
  static toEnrollment(row: any) {
    return {
      id: row.student_id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      gradeName: row.grade_name,
      sectionName: row.section_name,
      academicYearId: row.academic_year_id,
      academicStartYear: row.academic_start_year,
      academicEndYear: row.academic_end_year,
      academicStartDate: row.academic_start_date,
      academicEndDate: row.academic_end_date,
      schoolId: row.school_id,
      gradeId: row.grade_id,
      sectionId: row.section_id,
      enrollmentDate: row.enrollment_date,
      enrollmentStatus: row.enrollment_status,
      scope: UserScope.STUDENT,
    };
  }

  static toEnrollments(rows: any[]) {
    return rows.map(this.toEnrollment);
  }
}
