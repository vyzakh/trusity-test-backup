import { SchoolMapper } from '@application/mappers';
import { IECScoreFilter } from '@presentation/graphql/modules/student/dto/business-progress.args';
import { BusinessStatus, SchoolStatus } from '@shared/enums';
import { ComparisonOperator } from '@shared/enums/business-performance.enum';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { applyOffsetPagination, isDefined, isDefinedStrict } from '@shared/utils';
import { Knex } from 'knex';
import { completedBusinessExpression, completedCommunicationExpression, completedEntrepreneurshipExpression, completedInnovationExpression } from './business.repository';

export class SchoolRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async createSchool(input: Record<string, any>) {
    const [row] = await this.db('school').insert(
      {
        name: input.name,
        account_type: input.accountType,
        academic_base_year: input.academicBaseYear,
        academic_start_month: input.academicStartMonth,
        academic_end_month: input.academicEndMonth,
        promotion_start_month: input.promotionStartMonth,
        promotion_start_day: input.promotionStartDay,
        total_license: input.totalLicense,
        license_expiry: input.licenseExpiry,
        city_id: input.cityId,
        state_id: input.stateId,
        country_id: input.countryId,
        postal_code: input.postalCode,
        address_contact_number: input.addressContactNumber,
        street_address_line1: input.streetAddressLine1,
        street_address_line2: input.streetAddressLine2,
        poc_name: input.pocName,
        principal_name: input.principalName,
        poc_contact_number: input.pocContactNumber,
        poc_email: input.pocEmail,
        logo_url: input.logoUrl,
      },
      '*',
    );
    return SchoolMapper.toSchool(row);
  }
  async updateSchool(input: Record<string, any>) {
    const columnsForUpdate: Record<string, string> = {
      name: 'name',
      totalLicense: 'total_license',
      licenseExpiry: 'license_expiry',
      currentAYId: 'current_ay_id',
      cityId: 'city_id',
      stateId: 'state_id',
      academicStartMonth: 'academic_start_month',
      academicEndMonth: 'academic_end_month',
      promotionStartMonth: 'promotion_start_month',
      promotionStartDay: 'promotion_start_day',
      countryId: 'country_id',
      postalCode: 'postal_code',
      principalName: 'principal_name',
      addressContactNumber: 'address_contact_number',
      streetAddressLine1: 'street_address_line1',
      streetAddressLine2: 'street_address_line2',
      pocName: 'poc_name',
      pocContactNumber: 'poc_contact_number',
      pocEmail: 'poc_email',
      logoUrl: 'logo_url',
      lastPromotionYear: 'last_promotion_year',
      promotionErrors: 'promotion_errors',
      promotionCompletedAt: 'promotion_completed_at',
      updatedAt: 'updated_at',
    };

    const data: Record<string, any> = {};
    for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
      if (isDefined(input[inputKey])) {
        data[dbKey] = input[inputKey];
      }
    }

    const query = this.db('school').update(data, '*').where({
      id: input.schoolId,
    });

    if (isDefinedStrict(input.accountType)) {
      query.where({ account_type: input.accountType });
    }

    const [row] = await query;

    if (!row) return null;

    return SchoolMapper.toSchool(row);
  }

  async createSchoolGrade(input: Record<string, any>) {
    await this.db('school_grade').insert({
      school_id: input.schoolId,
      grade_id: input.gradeId,
    });
  }

  async upsertSchoolGrade(input: Record<string, any>) {
    await this.db('school_grade')
      .insert({
        school_id: input.schoolId,
        grade_id: input.gradeId,
      })
      .onConflict(['school_id', 'grade_id'])
      .ignore();
  }

  async upsertSchoolGradeSections(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => ({
      school_id: input.schoolId,
      grade_id: input.gradeId,
      section_id: input.sectionId,
    }));

    await this.db('school_section').insert(data).onConflict(['school_id', 'grade_id', 'section_id']).ignore();
  }

  async upsertSchoolSections(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => ({
      school_id: input.schoolId,
      grade_id: input.gradeId,
      section_id: input.sectionId,
    }));

    await this.db('school_section').insert(data).onConflict(['school_id', 'grade_id', 'section_id']).ignore();
  }

  async associateSchoolCurriculums(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => ({
      school_id: input.schoolId,
      curriculum_id: input.curriculumId,
      name: input.curriculumName,
    }));

    await this.db('school_curriculum').insert(data);
  }

  async updateLicenseCount(input: Record<string, any>) {
    await this.db('school').where({ id: input.schoolId }).increment('used_license', input.changeBy);
  }

  async upsertAcademicYear(input: Record<string, any>) {
    const [row] = await this.db('academic_year')
      .insert({
        school_id: input.schoolId,
        start_year: input.startYear,
        end_year: input.endYear,
        start_date: input.startDate,
        end_date: input.endDate,
      })
      .returning('*')
      .onConflict(['school_id', 'start_year', 'end_year'])
      .merge();

    return SchoolMapper.toAcademicYear(row);
  }

  async getEnrollmentStatus() {
    const rows = await this.db('enrollment_status as es').select(['es.*']);

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }));
  }

  async getAcademicYear(input: Record<string, any>) {
    const query = this.db('academic_year as ay').select(['ay.*']);

    query.modify((qb) => {
      if (isDefined(input.academicYearId)) {
        qb.where({ 'ay.id': input.academicYearId });
      }

      if (isDefined(input.schoolId)) {
        qb.where({ 'ay.school_id': input.schoolId });
      }

      if (isDefined(input.startYear)) {
        qb.where({ 'ay.start_year': input.startYear });
      }

      if (isDefined(input.endYear)) {
        qb.where({ 'ay.end_year': input.endYear });
      }

      if (isDefined(input.academicYearStartDate)) {
        qb.where({ 'ay.start_date': input.academicYearStartDate });
      }

      if (isDefined(input.academicYearEndDate)) {
        qb.where({ 'ay.end_date': input.academicYearEndDate });
      }

      if (isDefined(input.studentId)) {
        qb.join('enrollment as enr', 'enr.academic_year_id', 'ay.id').where({
          'enr.student_id': input.studentId,
        });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return SchoolMapper.toAcademicYear(row);
  }

  async getCurrentAcademicYear(input: Record<string, any>) {
    const query = this.db('school').leftJoin('academic_year', 'school.current_ay_id', 'academic_year.id').select(['academic_year.*']);

    query.modify((qb) => {
      if (isDefined(input.schoolId)) {
        qb.where({ 'school.id': input.schoolId });
      }
    });

    const [row] = await query;

    return row ? SchoolMapper.toAcademicYear(row) : null;
  }

  async getAcademicYears(input: Record<string, any>) {
    const query = this.db('academic_year as ay').select(['ay.*']).distinct('ay.id');

    applyOffsetPagination(query, input.offset, input.limit, 100);

    query.modify((qb) => {
      if (isDefined(input.schoolId)) {
        qb.where({ 'ay.school_id': input.schoolId });
      }
      if (isDefined(input.studentId)) {
        qb.join('enrollment as e', 'e.academic_year_id', 'ay.id').where('e.student_id', input.studentId);
        if (isDefined(input.schoolId)) {
          qb.where('e.school_id', input.schoolId);
        }
      }
    });

    const rows = await query;

    return SchoolMapper.toAcademicYears(rows);
  }

  async activateSchool(input: Record<string, any>) {
    await this.db('school').update({ is_active: true, updated_at: input.updatedAt }).where({ id: input.schoolId, is_active: false });
  }

  async deactivateSchool(input: Record<string, any>) {
    const [row] = await this.db('school').update({ is_active: false, updated_at: input.updatedAt }).where({ id: input.schoolId, is_active: true }).returning('name');
    return row.name;
  }

  async deleteSchoolGrade(input: Record<string, any>) {
    await this.db('school_grade').del().where({
      school_id: input.schoolId,
      grade_id: input.gradeId,
    });
  }

  async deleteSchoolSection(input: Record<string, any>) {
    await this.db('school_section').del().where({
      school_id: input.schoolId,
      grade_id: input.gradeId,
      section_id: input.sectionId,
    });
  }

  async updateSchoolGrade(input: Record<string, any>) {
    const columnsForUpdate: Record<string, string> = {
      gradeId: 'grade_id',
    };

    const data: Record<string, any> = {
      updated_at: input.updatedAt,
    };

    for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
      if (isDefined(input[inputKey])) {
        data[dbKey] = input[inputKey];
      }
    }

    const query = this.db('school_grade').update(data, '*').where({ id: input.schoolGradeId });

    if (isDefined(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }

    const [row] = await query;

    if (!row) return null;

    return { id: row.id, gradeId: row.grade_id, schoolId: row.school_id };
  }

  async deleteSchoolGradeSections(input: Record<string, any>) {
    const query = this.db('school_section').del().where({
      grade_id: input.gradeId,
      school_id: input.schoolId,
    });

    query.modify((qb) => {
      if (input.sectionIds) {
        qb.whereIn('section_id', input.sectionIds);
      }
    });

    await query;
  }

  async getSchoolGradeSectionIds(input: Record<string, any>) {
    const rows = await this.db('school_section as ss').select(['ss.section_id']).where({
      school_id: input.schoolId,
      grade_id: input.gradeId,
    });

    return rows.map((row) => row.section_id);
  }

  async getSchoolGradeSections(input: Record<string, any>) {
    let query = this.db('school_section as ss').join('section as s', 's.id', 'ss.section_id').select(['s.*']).where({
      school_id: input.schoolId,
      grade_id: input.gradeId,
    });
    if (input.classAssignments && input.classAssignments.length > 0) {
      const assignedSectionIds = input.classAssignments.filter(([gradeId]) => gradeId === input.gradeId).map(([, sectionId]) => sectionId);

      if (assignedSectionIds.length > 0) {
        query = query.whereIn('s.id', assignedSectionIds);
      }
    }

    if (input.sectionIds?.length) {
      query.whereIn('s.id', input.sectionIds);
    }

    const rows = await query;

    return rows.map((row) => ({
      schoolId: input.schoolId,
      gradeId: input.gradeId,
      section: {
        id: row.id,
        name: row.name,
      },
    }));
  }

  async getSchoolGrades(input: Record<string, any>) {
    let query = this.db('school_grade as sg').join('grade as g', 'sg.grade_id', 'g.id').select(['g.*']).where({
      'sg.school_id': input.schoolId,
    });

    if (input.classAssignments && input.classAssignments.length > 0) {
      const assignedGradeIds: any[] = [...new Set(input.classAssignments.map(([gradeId]) => gradeId))];
      query = query.whereIn('sg.grade_id', assignedGradeIds);
    }
    if (input.gradeIds?.length) {
      query = query.whereIn('sg.grade_id', input.gradeIds);
    }

    const rows = await query.orderBy('g.rank', 'asc');

    return rows.map((row) => ({
      grade: {
        id: row.id,
        name: row.name,
        rank: row.rank,
      },
      schoolId: input.schoolId,
    }));
  }
  async getSchoolCarriculums(input: Record<string, any>) {
    const rows = await this.db('school_curriculum as sc')
      .join('curriculum as c', 'c.id', 'sc.curriculum_id')
      .select(['c.*', 'sc.name as other_name'])
      .where({ 'sc.school_id': input.schoolId });

    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        allowCustom: row.allow_custom,
        otherName: row.other_name,
      };
    });
  }

  async getSchool(input: Record<string, any>) {
    const query = this.db('school').select(['*']);

    query.modify((qb) => {
      if (input.isForUpdate) {
        qb.forUpdate();
      }
      if (input.schoolId) {
        qb.where({ id: input.schoolId });
      }
    });

    const [row] = await query;

    return row ? SchoolMapper.toSchool(row) : null;
  }

  async getSchoolById(input: Record<string, any>) {
    const [row] = await this.db('school').select(['*']).where({
      id: input.schoolId,
    });

    if (!row) return null;

    return SchoolMapper.toSchool(row);
  }

  async getSchoolGrade(input: Record<string, any>) {
    const query = this.db('school_grade as sg').join('grade as g', 'sg.grade_id', 'g.id').select(['sg.*', 'g.name']).where({ 'sg.grade_id': input.gradeId });

    if (isDefined(input.schoolId)) {
      query.where({ 'sg.school_id': input.schoolId });
    }

    const [row] = await query;

    if (!row) return null;

    return { id: row.id, name: row.name, schoolId: row.school_id };
  }
  async getSchoolSection(input: Record<string, any>) {
    const [row] = await this.db('school_section').select(['*']).where({ id: input.schoolSectionId });

    if (!row) return null;

    return { id: row.id, schoolId: row.school_id, schoolGradeId: row.school_grade_id };
  }
  async getSchoolSectionsByIds(input: Record<string, any>) {
    const query = this.db('school_section').select(['*']).whereIn('id', input.schoolSectionIds);

    if (isDefined(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }

    const rows = await query;

    return rows.map((row) => {
      return { id: row.id, schoolId: row.school_id, schoolGradeId: row.school_grade_id };
    });
  }

  async deleteSchoolCurriculums(input: Record<string, any>) {
    await this.db('school_curriculum').del().where({ school_id: input.schoolId });
  }

  async countSchools(input: Record<string, any>) {
    const query = this.db('school').count('school.id as count');

    query.modify((qb) => {
      if (isDefinedStrict(input.accountType)) {
        qb.where('school.account_type', input.accountType);
      }

      if (isDefinedStrict(input.name)) {
        const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
        const regex = `.*${safeRegex}.*`;
        qb.whereRaw(`school.name ~* ?`, [regex]);
      }

      if (isDefinedStrict(input.isActive)) {
        qb.where({ 'school.is_active': input.isActive });
      }

      if (isDefinedStrict(input.countryId)) {
        query.where('school.country_id', input.countryId);
      }

      if (isDefinedStrict(input.I)) {
        this.applyIECFiltersToSchools(qb, 'avg_innovation_score', input.I);
      }

      if (isDefinedStrict(input.E)) {
        this.applyIECFiltersToSchools(qb, 'avg_entrepreneurship_score', input.E);
      }

      if (isDefinedStrict(input.C)) {
        this.applyIECFiltersToSchools(qb, 'avg_communication_score', input.C);
      }
    });

    const [{ count }] = await query;

    return parseInt(count as string, 10);
  }

  async getAverageBusinessScores(input: Record<string, any>) {
    const query = this.db
      .from('business')
      .leftJoin('enrollment', function () {
        this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
      })
      .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
      .leftJoin('business_progress_score', 'business.id', 'business_progress_score.business_id')
      .leftJoin('business_progress_status', 'business.id', 'business_progress_status.business_id')
      .select([
        this.db.raw(`
          AVG(
              CASE
              WHEN ${completedInnovationExpression}
              THEN
                (
                  business_progress_score.problem_statement +
                  business_progress_score.market_research +
                  business_progress_score.market_fit +
                  business_progress_score.prototype
                ) / 4.0
              ELSE 0
            END
          ) AS avg_innovation_score
        `),
        this.db.raw(`
          AVG(
            CASE
              WHEN ${completedEntrepreneurshipExpression} 
              THEN
                (
                  business_progress_score.business_model +
                  business_progress_score.financial_planning +
                  business_progress_score.marketing
                ) / 3.0
              ELSE 0
            END
          ) AS avg_entrepreneurship_score
        `),
        this.db.raw(`
          AVG(
            CASE
              WHEN ${completedCommunicationExpression}
              THEN
                business_progress_score.pitch_feedback
              ELSE 0
            END
          ) AS avg_communication_score
        `),
      ])
      .modify((qb) => {
        if (input.schoolId) qb.where('business.school_id', input.schoolId);
        if (input.studentId) qb.where('business.student_id', input.studentId);
        if (input.enrollmentStatus) qb.where('enrollment_status.code', input.enrollmentStatus);
        if (input.businessStatus === BusinessStatus.COMPLETED) qb.whereRaw(`(${completedBusinessExpression})`);
        if (input.businessStatus === BusinessStatus.IN_PROGRESS) qb.whereRaw(`NOT (${completedBusinessExpression})`);
      })
      .whereNull('business.deleted_at');

    const [row] = await query;

    if (!row) {
      return {
        avgInnovationScore: 0,
        avgEntrepreneurshipScore: 0,
        avgCommunicationScore: 0,
      };
    }

    return {
      avgInnovationScore: Number(row.avg_innovation_score),
      avgEntrepreneurshipScore: Number(row.avg_entrepreneurship_score),
      avgCommunicationScore: Number(row.avg_communication_score),
    };
  }
  async getSchoolStats(input: Record<string, any>) {
    const schoolStatesQuery = this.db('school as sch')
      .select({
        totalStudents: this.db('student as std')
          .countDistinct('std.id as count')
          .join('enrollment as enr', 'enr.student_id', 'std.id')
          .whereRaw('std.school_id = sch.id')
          .whereNotExists(function () {
            this.select('*')
              .from('public.enrollment as enr')
              .join('public.enrollment_status as es', 'es.id', 'enr.enrollment_status_id')
              .whereRaw('enr.student_id = std.id')
              .andWhere('es.code', 'graduated');
          }),

        totalTeachers: this.db('teacher as tchr').count('*').whereRaw('tchr.school_id = sch.id'),

        totalSections: this.db('school_section as ss').count('*').whereRaw('ss.school_id = sch.id'),

        totalGrades: this.db('school_grade as sg').count('*').whereRaw('sg.school_id = sch.id'),
      })
      .where({ 'sch.id': input.schoolId });

    this.applySchoolFilters(schoolStatesQuery, input);

    const [schoolStats] = await schoolStatesQuery;

    return {
      totalStudents: parseInt(schoolStats.totalStudents as string),
      totalTeachers: parseInt(schoolStats.totalTeachers as string),
      totalSections: parseInt(schoolStats.totalSections as string),
      totalGrades: parseInt(schoolStats.totalGrades as string),
    };
  }

  async getSchools(input: Record<string, any>) {
    const query = this.db('school').select(['school.*']).orderBy('school.created_at', 'desc');

    query.modify((qb) => {
      if (isDefinedStrict(input.accountType)) {
        qb.where('school.account_type', input.accountType);
      }

      if (isDefinedStrict(input.name)) {
        const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
        const regex = `.*${safeRegex}.*`;
        qb.whereRaw(`school.name ~* ?`, [regex]);
      }

      if (isDefinedStrict(input.isActive)) {
        qb.where({ 'school.is_active': input.isActive });
      }

      if (isDefinedStrict(input.countryId)) {
        qb.where('school.country_id', input.countryId);
      }

      if (isDefinedStrict(input.I)) {
        this.applyIECFiltersToSchools(qb, 'avg_innovation_score', input.I);
      }

      if (isDefinedStrict(input.E)) {
        this.applyIECFiltersToSchools(qb, 'avg_entrepreneurship_score', input.E);
      }

      if (isDefinedStrict(input.C)) {
        this.applyIECFiltersToSchools(qb, 'avg_communication_score', input.C);
      }
    });

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;

    return SchoolMapper.toSchools(rows);
  }

  applySchoolFilters(query: Knex.QueryBuilder, input: Record<string, any>) {
    if (input.accountType) {
      query.where('sch.account_type', input.accountType);
    }
    if (input.name) {
      const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      const regex = `.*${safeRegex}.*`;
      query.whereRaw(`sch.name ~* ?`, [regex]);
    }
    if (input.status) {
      switch (input.status) {
        case SchoolStatus.ACTIVE: {
          query.where({ 'sch.is_active': true });
          break;
        }
        case SchoolStatus.INACTIVE: {
          query.where({ 'sch.is_active': false });
          break;
        }
      }
    }
    if (input.country) {
      query.where('sch.country_id', input.country);
    }
  }

  applySchoolSorting(query: Knex.QueryBuilder, input: Record<string, any>) {
    if (input.sortBy) {
      const sortableColumns = ['created_at'];
      const sortOrders = ['asc', 'desc'];

      for (const sortItem of input.sortBy) {
        const column = sortItem.column;
        const order = sortItem.order;

        if (sortableColumns.includes(column) && sortOrders.includes(order)) {
          query.orderBy(`sch.${column}`, order);
        }
      }
    }
  }

  async checkSchoolGradeExists(input: Record<string, any>) {
    const query = this.db('school_section').count('* as count');

    query.modify((qb) => {
      if (isDefined(input.schoolId)) {
        query.where({ school_id: input.schoolId });
      }

      if (isDefined(input.gradeId)) {
        query.where({ grade_id: input.gradeId });
      }

      if (isDefined(input.sectionId)) {
        query.where({ section_id: input.sectionId });
      }
    });

    const [{ count }] = await query;

    return Number(count) > 0;
  }

  async countGrades(input: Record<string, any>) {
    const query = this.db('school_grade').count('* as count');

    query.modify((qb) => {
      if (isDefined(input.schoolId)) {
        qb.where({ school_id: input.schoolId });
      }
    });

    const [{ count }] = await query;

    return Number(count);
  }

  async countSections(input: Record<string, any>) {
    const query = this.db('school_section').count('* as count');

    query.modify((qb) => {
      if (isDefined(input.schoolId)) {
        qb.where({ school_id: input.schoolId });
      }
    });

    const [{ count }] = await query;

    return Number(count);
  }

  async applyIECFiltersToSchools(query: Knex.QueryBuilder, column: string, input: IECScoreFilter) {
    const aliasName = `school_scores_${column}`;
    const subQuery = this.db('business')
      .select([
        'business.school_id',
        this.db.raw(`
          TRUNC(
            AVG(
              CASE
                WHEN ${completedInnovationExpression}
                THEN
                  (
                    business_progress_score.problem_statement +
                    business_progress_score.market_research +
                    business_progress_score.market_fit +
                    business_progress_score.prototype
                  ) / 4.0
                ELSE 0
              END
            )::numeric, 2
          ) AS avg_innovation_score
        `),
        this.db.raw(`
          TRUNC(
            AVG(
              CASE
                WHEN ${completedEntrepreneurshipExpression} 
                THEN
                  (
                    business_progress_score.business_model +
                    business_progress_score.financial_planning +
                    business_progress_score.marketing
                  ) / 3.0
                ELSE 0
              END
            )::numeric, 2
          ) AS avg_entrepreneurship_score
        `),
        this.db.raw(`
          TRUNC(
            AVG(
              CASE
                WHEN ${completedCommunicationExpression}
                THEN
                  business_progress_score.pitch_feedback
                ELSE 0
              END
            )::numeric, 2
          ) AS avg_communication_score
        `),
      ])
      .leftJoin('enrollment', function () {
        this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
      })
      .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
      .leftJoin('business_progress_score', 'business_progress_score.business_id', 'business.id')
      .leftJoin('business_progress_status', 'business_progress_status.business_id', 'business_progress_score.business_id')
      .groupBy('business.school_id')
      .modify((qb) => {
        qb.where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE);
      })
      .whereNull('business.deleted_at')
      .as(aliasName);

    query.leftJoin(subQuery, `${aliasName}.school_id`, 'school.id');

    const qualifiedColumn = `${aliasName}.${column}`;

    switch (input.comparison) {
      case ComparisonOperator.LT:
        query.where((subQb) => {
          subQb.whereNotNull(qualifiedColumn).where(qualifiedColumn, '<', input.scoreValue).orWhereNull(qualifiedColumn);
        });
        break;
      case ComparisonOperator.GT:
        query.whereNotNull(qualifiedColumn).where(qualifiedColumn, '>', input.scoreValue);
        break;
      case ComparisonOperator.EQ:
        if (input.scoreValue === 0) {
          query.where((subQb) => {
            subQb.where(qualifiedColumn, '=', 0).orWhereNull(qualifiedColumn);
          });
        } else {
          query.whereNotNull(qualifiedColumn).where(qualifiedColumn, '=', input.scoreValue);
        }
        break;
    }
  }
}
