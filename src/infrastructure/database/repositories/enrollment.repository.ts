import { CommonMapper } from '@application/mappers';
import { StudentMapper } from '@application/mappers/student.mapper';
import { BadRequestException } from '@shared/execeptions';
import { AppExceptionType } from '@shared/execeptions/base.exception';
import { isDefined, isDefinedStrict } from '@shared/utils';
import { Knex } from 'knex';

export class EnrollmentRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async getStudentGrade(input: Record<string, any>) {
    const query = this.db('enrollment as enr')
      .select(['g.*'])
      .join('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id')
      .join('student as std', 'enr.student_id', 'std.id')
      .join('grade as g', 'g.id', 'enr.grade_id')
      .where({ 'enr.student_id': input.studentId });

    if (isDefined(input.enrollmentStatus)) {
      query.where({ 'enrs.code': input.enrollmentStatus });
    }
    if (isDefinedStrict(input.academicYearId)) {
      query.where({ 'enr.academic_year_id': input.academicYearId });
    }

    const [row] = await query;

    if (!row) return null;

    return CommonMapper.toGrade(row);
  }

  async getStudentSection(input: Record<string, any>) {
    const query = this.db('enrollment as enr')
      .select(['s.*'])
      .join('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id')
      .join('student as std', 'enr.student_id', 'std.id')
      .join('section as s', 's.id', 'enr.section_id')
      .where({ 'enr.student_id': input.studentId });

    if (isDefined(input.enrollmentStatus)) {
      query.where({ 'enrs.code': input.enrollmentStatus });
    }

    const [row] = await query;

    if (!row) return null;

    return CommonMapper.toSection(row);
  }

  async getEnrollment(input: Record<string, any>) {
    const query = this.db('enrollment as enr')
      .select(['enr.*', 'enrs.code as enrollment_status_code', 'g.name as grade_name', 's.name as section_name'])
      .join('student as std', 'enr.student_id', 'std.id')
      .join('grade as g', 'g.id', 'enr.grade_id')
      .join('section as s', 's.id', 'enr.section_id')
      .join('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id');

    if (isDefinedStrict(input.studentId)) {
      query.where({ 'enr.student_id': input.studentId });
    }
    if (isDefinedStrict(input.academicYearId)) {
      query.where({ 'enr.academic_year_id': input.academicYearId });
    }
    if (isDefinedStrict(input.schoolId)) {
      query.where({ 'enr.school_id': input.schoolId });
    }
    if (isDefinedStrict(input.enrollmentStatus)) {
      query.where({ 'enrs.code': input.enrollmentStatus });
    }

    const [row] = await query;

    if (!row) return null;

    return StudentMapper.toStudentEnrollment(row);
  }

  async updateEnrollment(input: Record<string, any>) {
    try {
      const columnsForUpdate: Record<string, string> = {
        gradeId: 'grade_id',
        sectionId: 'section_id',
        updatedAt: 'updated_at',
      };

      const data: Record<string, any> = {};
      for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
        if (isDefined(input[inputKey])) {
          data[dbKey] = input[inputKey];
        }
      }

      const query = this.db('enrollment').update(data, '*');

      query.modify((qb) => {
        if (isDefined(input.academicYearId)) {
          qb.where({ academic_year_id: input.academicYearId });
        }

        if (isDefined(input.studentId)) {
          qb.where({ student_id: input.studentId });
        }

        if (isDefined(input.schoolId)) {
          qb.where({ school_id: input.schoolId });
        }
      });

      await query;
    } catch (error) {
      if (error.code === '23503') {
        if (error.constraint === 'student_school_id_grade_id_section_id_foreign') {
          throw new BadRequestException('The School, Grade, or Section information you entered is invalid or does not exist in the system.', {
            type: AppExceptionType.GRADE_SECTION_MISMATCH,
          });
        }
      }

      throw error;
    }
  }
}
