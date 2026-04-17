import { CommonMapper, EnrollmentMapper } from '@application/mappers';
import { StudentMapper } from '@application/mappers/student.mapper';
import { BusinessStatus } from '@shared/enums';
import { ComparisonOperator } from '@shared/enums/business-performance.enum';
import { BadRequestException } from '@shared/execeptions';
import { AppExceptionType } from '@shared/execeptions/base.exception';
import { applyOffsetPagination, isDefined } from '@shared/utils';
import { Knex } from 'knex';
import { completedBusinessExpression, completedCommunicationExpression, completedEntrepreneurshipExpression, completedInnovationExpression } from './business.repository';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';

export class StudentRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async createStudent(input: Record<string, any>) {
    try {
      const [row] = await this.db('student').insert(
        {
          name: input.name,
          email: input.email,
          current_ay_id: input.currentAYId,
          grade_id: input.gradeId,
          section_id: input.sectionId,
          date_of_birth: input.dateOfBirth,
          contact_number: input.contactNumber,
          user_account_id: input.userAccountId,
          school_id: input.schoolId,
          account_type: input.accountType,
          guardian_name: input.guardianName,
          guardian_email: input.guardianEmail,
          guardian_contact_number: input.guardianContactNumber,
        },
        '*',
      );

      return StudentMapper.toStudent(row);
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'student_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.', {
            type: AppExceptionType.DUPLICATE_EMAIL,
          });
        }
      }
      if (error.code === '23503') {
        if (error.constraint === 'student_school_id_grade_id_section_id_foreign') {
          throw new BadRequestException('The Grade, or Section information you entered is invalid or does not exist in the system.', {
            type: AppExceptionType.GRADE_SECTION_MISMATCH,
          });
        }
      }

      throw error;
    }
  }

  async updateStudent(input: Record<string, any>) {
    try {
      const columnsForUpdate: Record<string, string> = {
        b2bSchoolId: 'school_id',
        b2cSchoolId: 'school_id',
        name: 'name',
        email: 'email',
        contactNumber: 'contact_number',
        dateOfBirth: 'date_of_birth',
        guardianName: 'guardian_name',
        guardianEmail: 'guardian_email',
        guardianContactNumber: 'guardian_contact_number',
        avatarUrl: 'avatar_url',
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

      const query = this.db('student').update(data, '*');

      query.modify((qb) => {
        if (isDefined(input.studentId)) {
          qb.where({ id: input.studentId });
        }
        if (isDefined(input.accountType)) {
          qb.where({ account_type: input.accountType });
        }
        if (isDefined(input.schoolId)) {
          qb.where({ school_id: input.schoolId });
        }
      });

      const [row] = await query;

      if (!row) return null;

      return StudentMapper.toStudent(row);
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'student_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.');
        }
      }

      throw error;
    }
  }

  async getStudent(input: Record<string, any>) {
    const query = this.db('student as std')
      .select(['std.*', 'enr.*', 'enrs.code as enrollment_status_code'])
      .leftJoin('enrollment as enr', 'enr.student_id', 'std.id')
      .leftJoin('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id');

    query.modify((qb) => {
      if (isDefined(input.studentId)) {
        qb.where({ 'std.id': input.studentId });
      }
      if (isDefined(input.userAccountId)) {
        qb.where({ 'std.user_account_id': input.userAccountId });
      }
      if (isDefined(input.accountType)) {
        qb.where({ 'std.account_type': input.accountType });
      }
      if (isDefined(input.schoolId)) {
        qb.where({ 'enr.school_id': input.schoolId });
      }
      if (isDefined(input.enrollmentStatus)) {
        qb.where({ 'enrs.code': input.enrollmentStatus });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return StudentMapper.toStudent(row);
  }

  async deleteStudent(input: Record<string, any>) {
    const query = this.db('student').del().where({
      id: input.studentId,
    });

    query.modify((qb) => {
      if (isDefined(input.accountType)) {
        qb.where({ account_type: input.accountType });
      }
      if (isDefined(input.schoolId)) {
        qb.where({ school_id: input.schoolId });
      }
    });

    await query;
  }

  async createEnrollment(input: Record<string, any>) {
    try {
      await this.db('enrollment').insert({
        student_id: input.studentId,
        academic_year_id: input.academicYearId,
        school_id: input.schoolId,
        grade_id: input.gradeId,
        section_id: input.sectionId,
        enrollment_date: input.enrollmentDate,
        enrollment_status_id: input.enrollmentStatusId,
      });
    } catch (error) {
      if (error.code === '23503') {
        if (error.constraint === 'student_school_id_grade_id_section_id_foreign') {
          throw new BadRequestException('The Grade, or Section information you entered is invalid or does not exist in the system.', {
            type: AppExceptionType.GRADE_SECTION_MISMATCH,
          });
        }
      }

      throw error;
    }
  }

  async getAcademicYear(input: Record<string, any>) {
    const query = this.db('enrollment as e')
      .leftJoin('enrollment_status as es', 'e.enrollment_status_id', 'es.id')
      .join('academic_year as ay', 'e.academic_year_id', 'ay.id')
      .select(['ay.*']);

    query.modify((qb) => {
      if (isDefined(input.studentId)) {
        qb.where({ 'e.student_id': input.studentId });
      }

      if (isDefined(input.schoolId)) {
        qb.where({ 'e.school_id': input.schoolId });
      }

      if (isDefined(input.academicYearId)) {
        qb.where({ 'e.academic_year_id': input.academicYearId });
      }

      if (isDefined(input.enrollmentStatus)) {
        qb.where({ 'es.code': input.enrollmentStatus });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return CommonMapper.toAcademicYear(row);
  }

  async getStudentIds(input: Record<string, any>) {
    const query = this.db('student as std')
      .distinctOn('std.id')
      .select(['std.id'])
      .leftJoin('enrollment as enr', 'enr.student_id', 'std.id')
      .leftJoin('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id')
      .where('enrs.code', EnrollmentStatusEnum.ACTIVE)

    query.modify((qb) => {
      if (input.schoolId) {
        qb.where('enr.school_id', input.schoolId);

        if (input.gradeId) {
          qb.where('enr.grade_id', input.gradeId);

          if (input.sectionId) {
            qb.where('enr.section_id', input.sectionId);
          }
        }
      }

      if (input.accountType) {
        qb.where('std.account_type', input.accountType);
      }

      if (input.teacherId) {
        qb.whereIn(['enr.grade_id', 'enr.section_id'], this.db('teacher_section as tsec').select(['tsec.grade_id', 'tsec.section_id']).where('tsec.teacher_id', input.teacherId));
      }

      if (input.academicYearId) {
        qb.where('enr.academic_year_id', input.academicYearId);
      }

      if (input.classAssignments) {
        qb.whereIn(['enr.grade_id', 'enr.section_id'], input.classAssignments);
      }

      if (input.enrollmentStatus) {
        qb.where('enrs.code', input.enrollmentStatus);
      }

      if (input.studentIds) {
        qb.whereIn('std.id', input.studentIds);
      }
    });

    const rows = await query;

    return StudentMapper.toStudentIds(rows);
  }

  private getBusinessScoresSubquery(input: Record<string, any>) {
    return this.db('business as b')
      .select(
        'b.student_id',
        this.db.raw(`
          TRUNC(
            AVG(
              CASE 
                WHEN ${completedInnovationExpression}
                THEN (bpsc.problem_statement + bpsc.market_research + bpsc.market_fit + bpsc.prototype) / 4.0
              END
            )::numeric, 2
          ) as avg_innovation_score
        `),
        this.db.raw(`
          TRUNC(
            AVG(
              CASE 
                WHEN ${completedEntrepreneurshipExpression}
                THEN (bpsc.financial_planning + bpsc.marketing + bpsc.business_model) / 3.0
              END
            )::numeric, 2
          ) as avg_entrepreneurship_score
        `),
        this.db.raw(`
          TRUNC(
            AVG(
              CASE 
                WHEN ${completedCommunicationExpression}
                THEN bpsc.pitch_feedback
              END
            )::numeric, 2
          ) as avg_communication_score
        `),
      )
      .leftJoin('business_progress_score as bpsc', 'bpsc.business_id', 'b.id')
      .leftJoin('business_progress_status as bps2', 'bps2.business_id', 'b.id')
      .leftJoin('business_progress_status as business_progress_status', 'business_progress_status.business_id', 'b.id')
      .join('enrollment as enr', function () {
        this.on('enr.student_id', '=', 'b.student_id').andOn('enr.academic_year_id', '=', 'b.ay_id');
      })
      .leftJoin('enrollment_status as enrs', 'enrs.id', 'enr.enrollment_status_id')
      .modify((qb) => {
        if (input.academicYearId) {
          qb.where('enr.academic_year_id', input.academicYearId);
        }
        if (input.gradeId) {
          qb.where('enr.grade_id', input.gradeId);
        }
        if (input.sectionId) {
          qb.where('enr.section_id', input.sectionId);
        }
        if (input.enrollmentStatus) {
          qb.where('enrs.code', input.enrollmentStatus);
        }
      })
      .groupBy('b.student_id')
      .as('avg_scores');
  }

  private applyStudentFilters(qb: any, input: Record<string, any>) {
    if (input.name) {
      const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      qb.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
    }

    if (input.schoolId) {
      qb.where('enr.school_id', input.schoolId);

      if (input.gradeId) {
        qb.where('enr.grade_id', input.gradeId);

        if (input.sectionId) {
          qb.where('enr.section_id', input.sectionId);
        }
      }
    }

    if (input.accountType) {
      qb.where('std.account_type', input.accountType);
    }

    if (input.teacherId) {
      qb.whereIn(['enr.grade_id', 'enr.section_id'], this.db('teacher_section as tsec').select(['tsec.grade_id', 'tsec.section_id']).where('tsec.teacher_id', input.teacherId));
    }

    if (input.academicYearId) {
      qb.where('enr.academic_year_id', input.academicYearId);
    }

    if (input.classAssignments && input.classAssignments.length > 0) {
      qb.where((qb2) => {
        input.classAssignments.forEach((assignment) => {
          qb2.orWhere((qb3) => {
            qb3.where('enr.grade_id', assignment[0]).where('enr.section_id', assignment[1]);
          });
        });
      });
    }
    if (input.enrollmentStatus) {
      qb.where('enrs.code', input.enrollmentStatus);
    }

    if (input.studentIds && input.studentIds.length > 0) {
      qb.whereIn('std.id', input.studentIds);
    }

    if (input.businessStatus) {
      qb.join('business', function () {
        this.on('business.student_id', '=', 'std.id').andOn('business.ay_id', '=', 'enr.academic_year_id');
      }).join('business_progress_status', 'business_progress_status.business_id', 'business.id');

      if (input.businessStatus === BusinessStatus.COMPLETED) qb.whereRaw(`(${completedBusinessExpression})`);
      if (input.businessStatus === BusinessStatus.IN_PROGRESS) qb.whereRaw(`NOT (${completedBusinessExpression})`);
    }

    if (input.I) {
      const scoreColumn = 'avg_scores.avg_innovation_score';
      this.applyScoreFilter(qb, scoreColumn, input.I);
    }

    if (input.E) {
      const scoreColumn = 'avg_scores.avg_entrepreneurship_score';
      this.applyScoreFilter(qb, scoreColumn, input.E);
    }

    if (input.C) {
      const scoreColumn = 'avg_scores.avg_communication_score';
      this.applyScoreFilter(qb, scoreColumn, input.C);
    }
  }

  async getStudents(input: Record<string, any>) {
    let businessScoresSubquery;

    if (input.I || input.E || input.C || input.businessStatus) {
      businessScoresSubquery = this.getBusinessScoresSubquery(input);
    }

    const query = this.db('student as std')
      .distinctOn('std.id')
      .select(
        input.I || input.E || input.C || input.businessStatus
          ? [
              'std.*',
              'enr.grade_id',
              'enr.section_id',
              'enrs.code as enrollment_status_code',
              'avg_scores.avg_innovation_score',
              'avg_scores.avg_entrepreneurship_score',
              'avg_scores.avg_communication_score',
            ]
          : ['std.*', 'enr.grade_id', 'enr.section_id', 'enrs.code as enrollment_status_code'],
      )
      .leftJoin('enrollment as enr', 'enr.student_id', 'std.id')
      .leftJoin('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id');

    if (input.I || input.E || input.C || input.businessStatus) {
      query.leftJoin(businessScoresSubquery, 'avg_scores.student_id', 'std.id');
    }

    query.orderBy('std.id', 'desc');

    query.modify((qb) => {
      this.applyStudentFilters(qb, input);

      if (input.countryId) {
        qb.leftJoin('school as sch', 'sch.id', 'enr.school_id').where('sch.country_id', input.countryId);
      }

      if (input.excludeUserAccountIds && input.excludeUserAccountIds.length > 0) {
        qb.whereNotIn('std.user_account_id', input.excludeUserAccountIds);
      }
    });

    applyOffsetPagination(query, input.offset, input.limit, 100);
    const rows = await query;
    return StudentMapper.toStudents(rows);
  }

  private applyScoreFilter(qb: any, scoreColumn: string, filter: any) {
    switch (filter.comparison) {
      case ComparisonOperator.LT:
        qb.where((subQb) => {
          subQb.whereNotNull(scoreColumn).where(scoreColumn, '<', filter.scoreValue).orWhereNull(scoreColumn);
        });
        break;
      case ComparisonOperator.GT:
        qb.whereNotNull(scoreColumn).where(scoreColumn, '>', filter.scoreValue);
        break;
      case ComparisonOperator.EQ:
        if (filter.scoreValue === 0) {
          qb.where((subQb) => {
            subQb.where(scoreColumn, '=', 0).orWhereNull(scoreColumn);
          });
        } else {
          qb.whereNotNull(scoreColumn).where(scoreColumn, '=', filter.scoreValue);
        }
        break;
      default:
        throw new Error(`Invalid comparison operator: ${filter.comparison}`);
    }
  }
  async countStudents(input: Record<string, any>) {
    let businessScoresSubquery;

    if (input.I || input.E || input.C || input.businessStatus) {
      businessScoresSubquery = this.getBusinessScoresSubquery(input);
    }

    const query = this.db('student as std')
      .countDistinct('std.id as count')
      .leftJoin('enrollment as enr', 'enr.student_id', 'std.id')
      .leftJoin('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id')
      .leftJoin('school as sch', 'sch.id', 'enr.school_id')
      .where('sch.is_active', true);

    if (input.I || input.E || input.C || input.businessStatus) {
      query.leftJoin(businessScoresSubquery, 'avg_scores.student_id', 'std.id');
    }

    query.modify((qb) => {
      this.applyStudentFilters(qb, input);

      if (input.countryId) {
        qb.where('sch.country_id', input.countryId);
      }
    });

    const [{ count }] = await query;
    return parseInt(count as string, 10);
  }

  async getStudentGrade(input: Record<string, any>) {
    const query = this.db('enrollment')
      .select(['grade.*'])
      .leftJoin('enrollment_status', 'enrollment.enrollment_status_id', 'enrollment_status.id')
      .leftJoin('grade', 'grade.id', 'enrollment.grade_id')
      .where({ 'enrollment.student_id': input.studentId });

    query.modify((qb) => {
      if (isDefined(input.academicYearId)) {
        qb.where({ 'enrollment.academic_year_id': input.academicYearId });
      }
      if (isDefined(input.enrollmentStatus)) {
        qb.where({ 'enrollment_status.code': input.enrollmentStatus });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return CommonMapper.toGrade(row);
  }
  async getStudentSection(input: Record<string, any>) {
    const query = this.db('enrollment')
      .select(['section.*'])
      .leftJoin('enrollment_status as enrollment_status', 'enrollment.enrollment_status_id', 'enrollment_status.id')
      .leftJoin('section as section', 'section.id', 'enrollment.section_id')
      .where({ 'enrollment.student_id': input.studentId });

    query.modify((qb) => {
      if (isDefined(input.enrollmentStatus)) {
        qb.where({ 'enrollment_status.code': input.enrollmentStatus });
      }
      if (isDefined(input.academicYearId)) {
        qb.where({ 'enrollment.academic_year_id': input.academicYearId });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return CommonMapper.toSection(row);
  }

  async getStudentChallengeStats(input: Record<string, any>) {
    const [row] = await this.db('student as std')
      .select([
        this.db('challenge_assignment as ca')
          .leftJoin('enrollment as e', function () {
            this.on('e.student_id', '=', 'ca.student_id').andOn('e.academic_year_id', '=', 'ca.academic_year_id');
          })
          .leftJoin('enrollment_status as es', 'es.id', 'e.enrollment_status_id')
          .where('es.code', input.enrollmentStatus)
          .count('*')
          .whereRaw('ca.student_id = std.id')
          .andWhereRaw('ca.end_at >= CURRENT_DATE')
          .as('assigned'),

        this.db('business as b')
          .join('enrollment', function () {
            this.on('enrollment.student_id', '=', 'b.student_id').andOn('enrollment.academic_year_id', '=', 'b.ay_id');
          })
          .join('enrollment_status as es', 'es.id', 'enrollment.enrollment_status_id')
          .leftJoin('business_progress_status as bps', 'bps.business_id', 'b.id')
          .count('*')
          .whereRaw('b.student_id = std.id')
          .whereNull('b.deleted_at')
          .where('es.code', input.enrollmentStatus)
          .where('bps.problem_statement', true)
          .where('bps.market_research', true)
          .where('bps.market_fit', true)
          .where('bps.prototype', true)
          .where('bps.financial_planning', true)
          .where('bps.branding', true)
          .where('bps.marketing', true)
          .where('bps.revenue_model', true)
          .where('bps.capex', true)
          .where('bps.opex', true)
          .where('bps.business_model', true)
          .where('bps.pitch_script', true)
          .where('bps.pitch_deck', true)
          .where('bps.pitch_feedback', true)
          .where('bps.investment', true)
          .where('bps.launch', true)
          .as('completed'),

        this.db('business as b')
          .join('enrollment', function () {
            this.on('enrollment.student_id', '=', 'b.student_id').andOn('enrollment.academic_year_id', '=', 'b.ay_id');
          })
          .join('enrollment_status as es', 'es.id', 'enrollment.enrollment_status_id')
          .leftJoin('business_progress_status as bps', 'bps.business_id', 'b.id')
          .count('*')
          .whereRaw('b.student_id = std.id')
          .whereNull('b.deleted_at')
          .where('es.code', input.enrollmentStatus)
          .where((qb) => {
            qb.where('bps.problem_statement', false)
              .orWhere('bps.market_research', false)
              .orWhere('bps.market_fit', false)
              .orWhere('bps.prototype', false)
              .orWhere('bps.financial_planning', false)
              .orWhere('bps.branding', false)
              .orWhere('bps.marketing', false)
              .orWhere('bps.revenue_model', false)
              .orWhere('bps.capex', false)
              .orWhere('bps.opex', false)
              .orWhere('bps.business_model', false)
              .orWhere('bps.pitch_script', false)
              .orWhere('bps.pitch_deck', false)
              .orWhere('bps.pitch_feedback', false)
              .orWhere('bps.investment', false)
              .orWhere('bps.launch', false)
              .orWhereNull('bps.problem_statement')
              .orWhereNull('bps.market_research')
              .orWhereNull('bps.market_fit')
              .orWhereNull('bps.prototype')
              .orWhereNull('bps.financial_planning')
              .orWhereNull('bps.branding')
              .orWhereNull('bps.marketing')
              .orWhereNull('bps.revenue_model')
              .orWhereNull('bps.capex')
              .orWhereNull('bps.opex')
              .orWhereNull('bps.business_model')
              .orWhereNull('bps.pitch_script')
              .orWhereNull('bps.pitch_deck')
              .orWhereNull('bps.pitch_feedback')
              .orWhereNull('bps.investment')
              .orWhereNull('bps.launch');
          })
          .as('in_progress'),
      ])
      .where({ 'std.id': input.studentId });

    return {
      assigned: Number(row.assigned),
      completed: Number(row.completed),
      inProgress: Number(row.in_progress),
    };
  }

  async getStudentUser(input: Record<string, any>) {
    const query = this.db('student as std')
      .select(['std.*', 'enr.*', 'enrs.code as enrollment_status_code', 'g.name as grade_name', 's.name as section_name'])
      .leftJoin('enrollment as enr', 'enr.student_id', 'std.id')
      .leftJoin('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id')
      .leftJoin('grade as g ', 'g.id', 'enr.grade_id')
      .leftJoin('section as s ', 's.id', 'enr.section_id');

    query.modify((qb) => {
      if (isDefined(input.userAccountId)) {
        qb.where({ 'std.user_account_id': input.userAccountId });
      }
      if (isDefined(input.enrollmentStatus)) {
        qb.where({ 'enrs.code': input.enrollmentStatus });
      }
      if (isDefined(input.enrollmentStatuses)) {
        qb.whereIn('enrs.code', input.enrollmentStatuses);
      }
    });

    const [row] = await query;

    if (!row) return null;

    return StudentMapper.toStudent(row);
  }

  async getEnrollments(input: Record<string, any>) {
    const query = this.db('enrollment as e')
      .leftJoin('student as st', 'st.id', 'e.student_id')
      .leftJoin('academic_year as ay', 'ay.id', 'e.academic_year_id')
      .leftJoin('enrollment_status as es', 'e.enrollment_status_id', 'es.id')
      .leftJoin('grade as g', 'g.id', 'e.grade_id')
      .leftJoin('section as s', 's.id', 'e.section_id')
      .select([
        'e.*',
        'ay.start_year as academic_start_year',
        'ay.end_year as academic_end_year',
        'ay.start_date as academic_start_date',
        'ay.end_date as academic_end_date',
        'st.name as student_name',
        'st.email as student_email',
        'g.name as grade_name',
        's.name as section_name',
        'es.code as enrollment_status',
      ]);

    query.modify((qb) => {
      if (isDefined(input.schoolId)) {
        qb.where('e.school_id', input.schoolId);

        if (isDefined(input.gradeId)) {
          qb.where('e.grade_id', input.gradeId);

          if (isDefined(input.sectionId)) {
            qb.where('e.section_id', input.sectionId);
          }
        }
      }

      if (isDefined(input.academicYearId)) {
        qb.where('e.academic_year_id', input.academicYearId);
      }

      if (isDefined(input.studentId)) {
        qb.where('e.student_id', input.studentId);
      }

      if (isDefined(input.studentIds)) {
        qb.whereIn('e.student_id', input.studentIds);
      }

      if (isDefined(input.enrollmentStatus)) {
        qb.where('es.code', input.enrollmentStatus);
      }

      if (isDefined(input.enrollmentStatuses)) {
        qb.whereIn('es.code', input.enrollmentStatuses);
      }
    });

    const rows = await query;

    return EnrollmentMapper.toEnrollments(rows);
  }

  async getEnrollment(input: Record<string, any>) {
    const query = this.db('enrollment as e')
      .leftJoin('student as st', 'st.id', 'e.student_id')
      .leftJoin('academic_year as ay', 'ay.id', 'e.academic_year_id')
      .leftJoin('enrollment_status as es', 'e.enrollment_status_id', 'es.id')
      .leftJoin('grade as g', 'g.id', 'e.grade_id')
      .leftJoin('section as s', 's.id', 'e.section_id')
      .select([
        'e.*',
        'ay.start_year as academic_start_year',
        'ay.end_year as academic_end_year',
        'ay.start_date as academic_start_date',
        'ay.end_date as academic_end_date',
        'st.name as student_name',
        'st.email as student_email',
        'g.name as grade_name',
        's.name as section_name',
        'es.code as enrollment_status',
      ]);

    query.modify((qb) => {
      if (isDefined(input.schoolId)) {
        qb.where('e.school_id', input.schoolId);

        if (isDefined(input.gradeId)) {
          qb.where('e.grade_id', input.gradeId);

          if (isDefined(input.sectionId)) {
            qb.where('e.section_id', input.sectionId);
          }
        }
      }

      if (isDefined(input.academicYearId)) {
        qb.where('e.academic_year_id', input.academicYearId);
      }

      if (isDefined(input.studentId)) {
        qb.where('e.student_id', input.studentId);
      }

      if (isDefined(input.studentIds)) {
        qb.whereIn('e.student_id', input.studentIds);
      }

      if (isDefined(input.enrollmentStatus)) {
        qb.where('es.code', input.enrollmentStatus);
      }

      if (isDefined(input.enrollmentStatuses)) {
        qb.whereIn('es.code', input.enrollmentStatuses);
      }

      if (isDefined(input.userAccountId)) {
        qb.where('st.user_account_id', input.userAccountId);
      }
    });

    const [row] = await query;

    return row ? EnrollmentMapper.toEnrollment(row) : null;
  }

  async updateEnrollment(input: Record<string, any>) {
    const columnsForUpdate: Record<string, string> = {
      enrollmentStatusId: 'enrollment_status_id',
      schoolId: 'school_id',
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

    const query = this.db('enrollment').update(data);

    query.modify((qb) => {
      if (isDefined(input.qSchoolId)) {
        qb.where('school_id', input.qSchoolId);
      }

      if (isDefined(input.qAcademicYearId)) {
        qb.where('academic_year_id', input.qAcademicYearId);
      }

      if (isDefined(input.qStudentId)) {
        qb.where('student_id', input.qStudentId);
      }

      if (isDefined(input.qStudentIds)) {
        qb.whereIn('student_id', input.qStudentIds);
      }

      if (isDefined(input.qEnrollmentStatusId)) {
        qb.where('enrollment_status_id', input.qEnrollmentStatusId);
      }
    });

    await query;
  }

  async bulkCreateEnrollments(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => {
      return {
        student_id: input.studentId,
        academic_year_id: input.academicYearId,
        school_id: input.schoolId,
        grade_id: input.gradeId,
        section_id: input.sectionId,
        enrollment_date: input.enrollmentDate,
        enrollment_status_id: input.enrollmentStatusId,
      };
    });

    await this.db.batchInsert('enrollment', data, 500);
  }

  async getStudentOverview(input: Record<string, any>) {
    const query = this.db('student as std')
      .select(['std.*', 'enr.*', 'enrs.code as enrollment_status_code', 'g.name as grade_name', 's.name as section_name', 'sch.name as school_name'])
      .leftJoin('enrollment as enr', 'enr.student_id', 'std.id')
      .leftJoin('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id')
      .leftJoin('grade as g ', 'g.id', 'enr.grade_id')
      .leftJoin('section as s ', 's.id', 'enr.section_id')
      .leftJoin('school as sch', 'sch.id', 'enr.school_id');

    query.modify((qb) => {
      if (isDefined(input.studentId)) {
        qb.where({ 'std.id': input.studentId });
      }
      if (isDefined(input.schoolId)) {
        qb.where({ 'enr.school_id': input.schoolId });
      }
      if (isDefined(input.academicYearId)) {
        qb.where({ 'enr.academic_year_id': input.academicYearId });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return StudentMapper.toStudent(row);
  }

  async getStudentEnrollments(input: Record<string, any>) {
    const query = this.db('enrollment').modify((qb) => {
      if (isDefined(input.studentId)) {
        qb.where('enrollment.student_id', input.studentId);
      }
      if (isDefined(input.schoolId)) {
        qb.where('enrollment.school_id', input.schoolId);
      }

      qb.orderBy('enrollment.academic_year_id', 'asc');
    });

    const rows = await query;

    return StudentMapper.toStudentEnrollments(rows);
  }
}
