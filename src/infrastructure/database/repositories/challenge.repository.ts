import { ChallengeMapper, PlatformUserMapper, SdgMapper } from '@application/mappers';
import { StudentMapper } from '@application/mappers/student.mapper';
import { ChallengeParticipationEnum } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { applyOffsetPagination, isDefined } from '@shared/utils';
import { Knex } from 'knex';

export class ChallengeRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async getChallengeById(input: any) {
    const query = this.db('challenge_master').select(['*']).where({ id: input.challengeId });

    if (isDefined(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }
    if (isDefined(input.challengeCreatorType)) {
      query.where({ creator_type: input.challengeCreatorType });
    }

    const [row] = await query;

    if (!row) return null;

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

  async getChallenge(input: Record<string, any>) {
    const query = this.db('challenge_master').select(['*']);

    query.modify((qb) => {
      if (input.challengeId) {
        qb.where({ id: input.challengeId });
      }

      if (input.schoolId) {
        qb.where({ school_id: input.schoolId });
      }

      if (input.challengeCreatorType) {
        qb.where({ creator_type: input.challengeCreatorType });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return ChallengeMapper.toChallenge(row);
  }

  async createChallenge(input: Record<string, any>) {
    const [challenge] = await this.db('challenge_master').insert(
      {
        title: input.title,
        company_name: input.companyName,
        sdg_ids: input.sdgIds,
        sector_id: input.sectorId,
        description: input.description,
        visibility: input.visibility,
        expectation: input.expectation,
        scope: input.scope,
        creator_type: input.creatorType,
        school_id: input.schoolId,
        created_by: input.createdBy,
        logo_url: input.logoUrl,
        academic_year_id: input.academicYearId,
      },
      '*',
    );

    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      expectation: challenge.expectation,
      visibility: challenge.visibility,
      companyName: challenge.company_name,
      creatorType: challenge.creator_type,
      sectorId: challenge.sector_id,
      logoUrl: challenge.logo_url,
      academicYearId: challenge.academic_year_id,
      createdAt: challenge.created_at,
      updatedAt: challenge.updated_at,
    };
  }

  async associateChallengeSdgs(inputs: Record<string, any>[]) {
    const challengeSdgs = inputs.map((input) => {
      return {
        challenge_id: input.challengeId,
        sdg_id: input.sdgId,
      };
    });

    await this.db('challenge_sdg').insert(challengeSdgs);
  }

  async addVisibility(input: Record<string, any>) {
    const insertData = input.map((r) => ({
      challenge_id: r.challengeId,
      student_id: r.studentId,
    }));

    const [row] = await this.db('challenge_visibility_mapper').insert(insertData).returning('*');
    return row;
  }

  async getVisibleStudents(input: { challengeId: string }) {
    const query = this.db('student as s')
      .join('challenge_visibility_mapper as cvm', 'cvm.student_id', 's.id')
      .join('challenge_master as cm', 'cm.id', 'cvm.challenge_id')
      .leftJoin('enrollment as e', function () {
        this.on('e.student_id', '=', 'cvm.student_id').andOn('e.academic_year_id', '=', 'cm.academic_year_id');
      })
      .leftJoin('enrollment_status as es', 'es.id', 'e.enrollment_status_id')
      .where('es.code', EnrollmentStatusEnum.ACTIVE)
      .distinctOn('s.id')
      .select(['s.*']);

    query.modify((qb) => {
      if (input.challengeId) {
        qb.where({ 'cvm.challenge_id': input.challengeId });
      }
    });
    const rows = await query;
    return StudentMapper.toStudents(rows);
  }

  async getChallengeTargetStudentIds(input: Record<string, any>) {
    const rows = await this.db('challenge_visibility_mapper').select(['student_id']).where({
      challenge_id: input.challengeId,
    });

    return rows.map((row) => row.student_id);
  }

  async getChallengeTargetGrades(input: Record<string, any>) {
    const query = this.db('challenge_visibility_mapper as cvm')
      .join('challenge_master as cm', 'cm.id', 'cvm.challenge_id')
      .join('enrollment as enr', function () {
        this.on('enr.student_id', '=', 'cvm.student_id').andOn('enr.academic_year_id', '=', 'cm.academic_year_id');
      })
      .leftJoin('grade as g', 'g.id', 'enr.grade_id')
      .where({ 'enr.enrollment_status_id': 1 })
      .distinctOn(['g.id'])
      .select(['cvm.challenge_id', 'g.id as grade_id', 'g.name as grade_name', 'cvm.student_id', 'enr.school_id']);
    query.modify((qb) => {
      if (input.challengeId) {
        qb.where({ 'cvm.challenge_id': input.challengeId });
      }
    });

    const rows = await query;
    return ChallengeMapper.toChallengeTargetGrades(rows);
  }

  async getChallengeTargetSections(input: Record<string, any>) {
    const query = this.db('challenge_visibility_mapper as cvm')
      .join('challenge_master as cm', 'cm.id', 'cvm.challenge_id')
      .join('enrollment as enr', function () {
        this.on('enr.student_id', '=', 'cvm.student_id').andOn('enr.academic_year_id', '=', 'cm.academic_year_id');
      })
      .leftJoin('section as s', 's.id', 'enr.section_id')
      .where({ 'enr.enrollment_status_id': 1 })
      .distinctOn(['s.id'])
      .select(['cvm.challenge_id', 's.id as section_id', 's.name as section_name', 'cvm.student_id', 'enr.school_id', 'enr.grade_id']);
    query.modify((qb) => {
      if (input.challengeId) {
        qb.where({ 'cvm.challenge_id': input.challengeId });
      }
      if (input.gradeId) {
        qb.where({ 'enr.grade_id': input.gradeId });
      }
    });

    const rows = await query;
    return ChallengeMapper.toChallengeTargetSections(rows);
  }

  async getChallengeTargetStudents(input: Record<string, any>) {
    const query = this.db('challenge_visibility_mapper as cvm')
      .join('challenge_master as cm', 'cm.id', 'cvm.challenge_id')
      .join('enrollment as enr', function () {
        this.on('enr.student_id', '=', 'cvm.student_id').andOn('enr.academic_year_id', '=', 'cm.academic_year_id');
      })
      .join('student as std', 'std.id', 'cvm.student_id')
      .where({ 'enr.enrollment_status_id': 1 })
      .distinctOn(['std.id'])
      .select(['std.*']);
    query.modify((qb) => {
      if (input.challengeId) {
        qb.where({ 'cvm.challenge_id': input.challengeId });
      }
      if (input.gradeId) {
        qb.where({ 'enr.grade_id': input.gradeId });
      }
      if (input.sectionId) {
        qb.where({ 'enr.section_id': input.sectionId });
      }
    });

    const rows = await query;
    return ChallengeMapper.toChallengeTargetStudents(rows);
  }

  async clearVisibilityMappings(input: Record<string, any>) {
    const { challengeId } = input;

    await this.db('challenge_visibility_mapper').where({ challenge_id: challengeId }).del();
  }

  async removeChallengeSdgs(input: any) {
    await this.db('challenge_sdg').where('challenge_id', input.challengeId).del();

    return true;
  }

  async findChallengeSdgs(input: any) {
    const challenegSdgs = await this.db('challenge_sdg as cs').join('sdg as sdg', 'cs.sdg_id', 'sdg.id').select('sdg.*').where('cs.challenge_id', input.challengeId);

    return SdgMapper.toEntityList(challenegSdgs);
  }

  async getChallengeSdgIds(input: any) {
    const challenegSdgIds = await this.db('challenge_sdg as cs').join('sdg as sdg', 'cs.sdg_id', 'sdg.id').select(['sdg.id']).where('cs.challenge_id', input.challengeId);

    return challenegSdgIds.map((challenegSdgId) => {
      return challenegSdgId as number;
    });
  }

  async getChallenges(input: Record<string, any>) {
    const query = this.db('challenge_master as cm').leftJoin('challenge_visibility_mapper as cvm', 'cvm.challenge_id', 'cm.id').distinctOn('cm.id').select(['cm.*']);

    this.applyChallengeFilters(query, input);

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;

    return rows.map((row) => {
      return {
        id: row.id,
        title: row.title,
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
        academicYearId: row.academic_year_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  async getAssignedChallenges(input: Record<string, any>) {
    const query = this.db('challenge_assignment as ca')
      .join('challenge_master as cm', 'cm.id', 'ca.challenge_id')
      .leftJoin('enrollment as e', function () {
        this.on('e.student_id', '=', 'ca.student_id').andOn('e.academic_year_id', '=', 'ca.academic_year_id');
      })
      .leftJoin('enrollment_status as es', 'es.id', 'e.enrollment_status_id')
      .where('es.code', EnrollmentStatusEnum.ACTIVE)
      .select(['cm.*', 'ca.start_at', 'ca.end_at']);

    if (isDefined(input.studentId)) {
      query.where({ 'ca.student_id': input.studentId });
    }

    if (isDefined(input.showActiveAssignmentsOnly)) {
      query.whereRaw('ca.end_at >= CURRENT_DATE');
    }

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;

    return rows.map((row) => {
      return {
        challenge: {
          id: row.id,
          title: row.title,
          description: row.description,
          expectation: row.expectation,
          companyName: row.company_name,
          scope: row.scope,
          creatorType: row.creator_type,
          schoolId: row.school_id,
          createdBy: row.created_by,
          sectorId: row.sector_id,
          logoUrl: row.logo_url,
          academicYearId: row.academic_year_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        startAt: row.start_at,
        endAt: row.end_at,
      };
    });
  }

  async getAssignedChallenge(input: Record<string, any>) {
    const query = this.db('challenge_assignment as ca').join('challenge_master as cm', 'cm.id', 'ca.challenge_id').select(['cm.*', 'ca.start_at', 'ca.end_at']);

    if (isDefined(input.studentId)) {
      query.where({ 'ca.student_id': input.studentId });
    }
    if (isDefined(input.challengeId)) {
      query.where({ 'ca.challenge_id': input.challengeId });
    }

    const [row] = await query;

    if (!row) return null;

    return {
      challenge: {
        id: row.id,
        title: row.title,
        description: row.description,
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
      },
      startAt: row.start_at,
      endAt: row.end_at,
    };
  }

  async findPlatformChallenge(input: any) {
    const [challenge] = await this.db('platform_challenge as pc')
      .leftJoin('challenge_master as cm', 'cm.id', 'pc.challenge_id')
      .leftJoin('platform_user as pu', 'pu.id', 'pc.created_by')
      .select(['cm.id', 'cm.title', 'cm.company_name', 'cm.sector_id', 'cm.description', 'cm.creator_type', 'cm.logo_url', 'cm.created_at', 'cm.updated_at'])
      .where({ 'pc.challenge_id': input.challengeId });

    if (!challenge) {
      return null;
    }

    return ChallengeMapper.toEntity(challenge);
  }

  async getPlatformChallengeCreatorByChallengeId(input: any) {
    const [row] = await this.db('platform_challenge as pc')
      .join('platform_user as pu', 'pu.id', 'pc.created_by')
      .join('user_account as ua', 'ua.id', 'pu.user_account_id')
      .select(['pu.*', 'ua.scope'])
      .where({ 'pc.challenge_id': input.challengeId });

    if (!row) {
      return null;
    }

    return PlatformUserMapper.toPlatformUsers(row);
  }

  async unassignChallengeFromSchool(input: Record<string, any>) {
    await this.db('challenge_school_assignment').del().where({
      challenge_id: input.challengeId,
      school_id: input.schoolId,
    });
  }

  async getChallengeAssignedSchools(input: Record<string, any>) {
    const query = this.db('challenge_assignment as ca')
      .select(['sch.*'])
      .distinct(['sch.id'])
      .join('student as std', 'std.id', 'ca.student_id')
      .join('school as sch', 'std.school_id', 'sch.id')
      .where({ 'ca.challenge_id': input.challengeId });

    if (isDefined(input.schoolId)) {
      query.where({ 'std.school_id': input.schoolId });
    }

    const rows = await query;

    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        accountType: row.account_type,
        address: {
          streetAddressLine1: row.street_address_line1,
          streetAddressLine2: row.street_address_line2,
          postalCode: row.postal_code,
          contactNumber: row.address_contact_number,
          countryId: row.country_id,
          stateId: row.state_id,
          cityId: row.city_id,
        },
        license: { totalLicense: row.total_license, usedLicense: row.used_license },
        contact: { name: row.poc_name, email: row.poc_email, contactNumber: row.poc_contact_number },
        logoUrl: row.logo_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }
  async getChallengeAssignedSchoolGrades(input: Record<string, any>) {
    const rows = await this.db('challenge_assignment as ca')
      .select(['g.*'])
      .distinct(['g.id'])
      .join('student as std', 'std.id', 'ca.student_id')
      .join('grade as g', 'std.grade_id', 'g.id')
      .where({ 'ca.challenge_id': input.challengeId, 'std.school_id': input.schoolId });

    return rows.map((row) => {
      return {
        grade: {
          id: row.id,
          name: row.name,
        },
        schoolId: input.schoolId,
      };
    });
  }
  async getChallengeAssignedSchoolSections(input: Record<string, any>) {
    const query = this.db('challenge_assignment as ca')
      .select(['s.*'])
      .distinct(['s.id'])
      .join('student as std', 'std.id', 'ca.student_id')
      .join('section as s', 'std.section_id', 's.id')
      .where({ 'ca.challenge_id': input.challengeId, 'std.grade_id': input.gradeId });

    if (isDefined(input.schoolId)) {
      query.where({ 'std.school_id': input.schoolId });
    }

    const rows = await query;

    return rows.map((row) => {
      return {
        section: {
          id: row.id,
          name: row.name,
        },
        schoolId: input.schoolId,
      };
    });
  }

  async getChallengeAssignedStudents(input: Record<string, any>) {
    const query = this.db('challenge_student_assignment as csa')
      .select(['std.*'])
      .join('student as std', 'csa.student_id', 'std.id')
      .where({ 'csa.challenge_id': input.challengeId });

    if (isDefined(input.schoolId)) {
      query.where({ 'csa.school_id': input.schoolId });
    }
    if (isDefined(input.schoolSectionId)) {
      query.where({ 'std.school_section_id': input.schoolSectionId });
    }

    const rows = await query;

    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        contactNumber: row.contact_number,
        dateOfBirth: row.date_of_birth,
        schoolId: row.school_id,
        userAccountId: row.user_account_id,
        accountType: row.account_type,
        grade: row.grade,
        section: row.section,
        guardian: {
          name: row.guardian_name,
          email: row.guardian_email,
          contactNumber: row.guardian_contact_number,
        },
      };
    });
  }

  async assignChallenge(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => ({
      challenge_id: input.challengeId,
      student_id: input.studentId,
      start_at: input.startAt,
      end_at: input.endAt,
      academic_year_id: input.academicYearId,
    }));

    await this.db('challenge_assignment').insert(data).onConflict(['challenge_id', 'student_id']).merge();
  }

  async unassignChallenge(input: Record<string, any>) {
    await this.db('challenge_assignment')
      .where({ challenge_id: input.challengeId })
      .modify((query) => {
        if (isDefined(input.schoolId)) {
          query.whereIn('student_id', function () {
            this.select('id').from('student').where('school_id', input.schoolId);
          });
        }
        if (isDefined(input.schoolGradeId)) {
          query.whereIn('student_id', function () {
            this.select('id').from('student').where('school_grade_id', input.schoolGradeId).whereNotNull('school_grade_id');
          });
        }
        if (isDefined(input.schoolSectionIds)) {
          query.whereIn('student_id', function () {
            this.select('id').from('student').whereIn('school_section_id', input.schoolSectionIds).whereNotNull('school_section_id');
          });
        }
      })
      .del();
  }

  async getChallengeAssignments(input: Record<string, any>) {
    const query = this.db('challenge_assignment as ca')
      .leftJoin('enrollment as e', function () {
        this.on('e.student_id', '=', 'ca.student_id').andOn('e.academic_year_id', '=', 'ca.academic_year_id');
      })
      .leftJoin('enrollment_status as es', 'es.id', 'e.enrollment_status_id')
      .where('es.code', EnrollmentStatusEnum.ACTIVE)
      .join('student as std', 'ca.student_id', 'std.id')
      .select(['std.*', 'ca.start_at', 'ca.end_at']);

    query.modify((qb) => {
      if (input.challengeId) {
        qb.where({ 'ca.challenge_id': input.challengeId });
      }

      if (input.name) {
        const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
        const regex = `.*${safeRegex}.*`;
        qb.whereRaw(`std.name ~* ?`, [regex]);
      }

      if (input.schoolId) {
        qb.where('std.school_id', input.schoolId);

        if (input.gradeId) {
          qb.where('std.grade_id', input.gradeId);

          if (input.sectionId) {
            qb.where('std.section_id', input.sectionId);
          }
        }
      }

      if (input.participation) {
        switch (input.participation) {
          case ChallengeParticipationEnum.PARTICIPATED: {
            qb.whereExists(function () {
              this.select(1).from('business as bs').whereRaw('bs.challenge_id = ca.challenge_id').andWhereRaw('bs.student_id = ca.student_id');
            });
            break;
          }
        }
      }

      if (input.classAssignments) {
        qb.whereIn(['std.grade_id', 'std.section_id'], input.classAssignments);
      }

      if (isDefined(input.showActiveAssignmentsOnly)) {
        qb.whereRaw('ca.end_at >= CURRENT_DATE');
      }
    });

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;

    return rows.map((row) => {
      return {
        student: {
          id: row.id,
          name: row.name,
          email: row.email,
          contactNumber: row.contact_number,
          dateOfBirth: row.date_of_birth,
          schoolId: row.school_id,
          userAccountId: row.user_account_id,
          accountType: row.account_type,
          gradeId: row.grade_id,
          sectionId: row.section_id,
          guardian: {
            name: row.guardian_name,
            email: row.guardian_email,
            contactNumber: row.guardian_contact_number,
          },
        },
        startAt: row.start_at,
        endAt: row.end_at,
      };
    });
  }
  async countChallengeAssignemnts(input: Record<string, any>) {
    const query = this.db('challenge_assignment as ca').join('student as std', 'ca.student_id', 'std.id').count('*');

    if (isDefined(input.challengeId)) {
      query.where({ 'ca.challenge_id': input.challengeId });
    }
    if (isDefined(input.studentId)) {
      query.where({ 'ca.student_id': input.studentId });
    }
    if (isDefined(input.name)) {
      const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      const regex = `.*${safeRegex}.*`;
      query.whereRaw(`std.name ~* ?`, [regex]);
    }
    if (isDefined(input.schoolId) || isDefined(input.schoolGradeId) || isDefined(input.schoolSectionId)) {
    }
    if (isDefined(input.schoolId)) {
      query.where({ 'std.school_id': input.schoolId });
    }
    if (input.schoolGradeIds) {
      query.whereIn('std.school_grade_id', input.schoolGradeIds);
    }
    if (input.schoolSectionIds) {
      query.whereIn('std.school_section_id', input.schoolSectionIds);
    }
    if (isDefined(input.schoolGradeId)) {
      query.where({ 'std.school_grade_id': input.schoolGradeId });
    }
    if (isDefined(input.schoolSectionId)) {
      query.where({ 'std.school_section_id': input.schoolSectionId });
    }
    if (isDefined(input.participation)) {
      if (input.participation === ChallengeParticipationEnum.PARTICIPATED) {
        query.whereExists(function () {
          this.select(1).from('business as bs').whereRaw('bs.challenge_id = ca.challenge_id').andWhereRaw('bs.student_id = ca.student_id');
        });
      }
    }
    if (isDefined(input.showActiveAssignmentsOnly)) {
      query.whereRaw('ca.end_at >= CURRENT_DATE');
    }

    const [{ count }] = await query;

    return parseInt(count as string);
  }

  async assignChallengeToSchools(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => {
      return {
        challenge_id: input.challengeId,
        school_id: input.schoolId,
      };
    });

    await this.db('challenge_school_assignment').insert(data);
  }
  async assignChallengeToSchoolGrades(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => {
      return {
        challenge_id: input.challengeId,
        school_id: input.schoolId,
        school_grade_id: input.schoolGradeId,
      };
    });

    await this.db('challenge_school_grade_assignment').insert(data);
  }
  async assignChallengeToSchoolSections(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => {
      return {
        challenge_id: input.challengeId,
        school_id: input.schoolId,
        school_section_id: input.schoolSectionId,
        is_entire: input.isEntire,
      };
    });

    await this.db('challenge_school_section_assignment').insert(data);
  }
  async assignChallengeToStudents(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => {
      return {
        challenge_id: input.challengeId,
        school_id: input.schoolId,
        student_id: input.studentId,
      };
    });

    await this.db('challenge_student_assignment').insert(data);
  }

  async isChallengeAssignedToSchool(input: Record<string, any>) {
    const [{ count }] = await this.db('challenge_school_assignment').count('* as count').where({
      challenge_id: input.challengeId,
      school_id: input.schoolId,
    });

    return Number(count) > 0;
  }
  async isChallengeAssignedToSchoolGrade(input: Record<string, any>) {
    const [{ count }] = await this.db('challenge_school_grade_assignment').count('* as count').where({
      challenge_id: input.challengeId,
      school_id: input.schoolId,
      school_grade_id: input.schoolGradeId,
    });

    return Number(count) > 0;
  }
  async isChallengeAssignedToSchoolSection(input: Record<string, any>) {
    const [{ count }] = await this.db('challenge_school_section_assignment').count('* as count').where({
      challenge_id: input.challengeId,
      school_id: input.schoolId,
      school_grade_id: input.schoolGradeId,
      school_section_id: input.schoolSectionId,
    });

    return Number(count) > 0;
  }

  async unassignChallengeFromStudents(inputs: { challengeId: string; studentId: string }[]) {
    for (const input of inputs) {
      await this.db('challenge_assignment')
        .where({
          challenge_id: input.challengeId,
          student_id: input.studentId,
        })
        .delete();
    }
  }

  async getChallengeAssignment(input: Record<string, any>) {
    const [row] = await this.db('challenge_school_assignment as csa')
      .join('school as s', 'csa.school_id', 's.id')
      .select(['s.*', 'csa.challenge_id'])
      .where({ 'csa.challenge_id': input.challengeId, 'csa.school_id': input.schoolId });

    if (!row) return null;

    return {
      school: {
        id: row.id,
        name: row.name,
        accountType: row.account_type,
        address: {
          streetAddressLine1: row.street_address_line1,
          streetAddressLine2: row.street_address_line2,
          postalCode: row.postal_code,
          contactNumber: row.address_contact_number,
          countryId: row.country_id,
          stateId: row.state_id,
          cityId: row.city_id,
        },
        license: { totalLicense: row.total_license, usedLicense: row.used_license },
        contact: { name: row.poc_name, email: row.poc_email, contactNumber: row.poc_contact_number },
        logoUrl: row.logo_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      challengeId: row.challenge_id,
    };
  }

  async getStudentsInChallenge(input: Record<string, any>) {
    const query = this.db('student as s').join('challenge_assignment as ca', 'ca.student_id', 's.id').distinctOn('s.id').select(['s.*']);

    query.modify((qb) => {
      if (input.challengeId) {
        qb.where({ 'ca.challenge_id': input.challengeId });
      }
    });
    const rows = await query;
    return StudentMapper.toStudents(rows);
  }

  async getStudentsIdsInChallenge(input: Record<string, any>) {
    const query = this.db('student as s').join('challenge_assignment as ca', 'ca.student_id', 's.id').distinctOn('s.id').select(['s.id']);

    query.modify((qb) => {
      if (input.challengeId) {
        qb.where({ 'ca.challenge_id': input.challengeId });
      }
    });
    const rows = await query;
    return StudentMapper.toStudentIds(rows);
  }

  async deleteChallenge(input: Record<string, any>) {
    const query = this.db('challenge_master').del().returning('title');

    if (isDefined(input.challengeId)) {
      query.where({ id: input.challengeId });
    }
    if (isDefined(input.scope)) {
      query.where({ scope: input.scope });
    }
    if (isDefined(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }
    if (isDefined(input.creatorType)) {
      query.where({ creator_type: input.creatorType });
    }
    if (isDefined(input.createdBy)) {
      query.where({ created_by: input.createdBy });
    }

    const [result] = await query;
    return result;
  }

  async updateChallenge(input: Record<string, any>) {
    const challengeUpdateQuery = this.db('challenge_master').where({
      id: input.challengeId,
    });

    const data: Record<string, any> = {};

    if (isDefined(input.title)) {
      data['title'] = input.title;
    }
    if (isDefined(input.sdgIds)) {
      data['sdg_ids'] = input.sdgIds;
    }
    if (isDefined(input.companyName)) {
      data['company_name'] = input.companyName;
    }
    if (isDefined(input.sectorId)) {
      data['sector_id'] = input.sectorId;
    }
    if (isDefined(input.description)) {
      data['description'] = input.description;
    }
    if (isDefined(input.visibility)) {
      data['visibility'] = input.visibility;
    }
    if (isDefined(input.expectation)) {
      data['expectation'] = input.expectation;
    }
    if (isDefined(input.logoUrl)) {
      data['logo_url'] = input.logoUrl;
    }
    if (isDefined(input.updatedAt)) {
      data['updated_at'] = input.updatedAt;
    }
    if (isDefined(input.academicYearId)) {
      data['academic_year_id'] = input.academicYearId;
    }

    challengeUpdateQuery.update(data, '*');

    if (isDefined(input.createdBy)) {
      challengeUpdateQuery.where({ created_by: input.createdBy });
    }

    const [challenge] = await challengeUpdateQuery;

    if (!challenge) {
      return null;
    }

    return {
      id: challenge.id,
      title: challenge.title,
      sdgIds: challenge.sdg_ids,
      description: challenge.description,
      visibility: challenge.visibility,
      expectation: challenge.expectation,
      companyName: challenge.company_name,
      creatorType: challenge.creator_type,
      schoolId: challenge.school_id,
      sectorId: challenge.sector_id,
      logoUrl: challenge.logo_url,
      createdAt: challenge.created_at,
      updatedAt: challenge.updated_at,
    };
  }

  async getChallengeSchoolLink(input: Record<string, any>) {
    const [row] = await this.db('school as s').select(['s.*']).join('challenge_school_link as csl', 'csl.school_id', 's.id').where({ 'csl.challenge_id': input.challengeId });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      accountType: row.account_type,
      address: {
        streetAddressLine1: row.street_address_line1,
        streetAddressLine2: row.street_address_line2,
        postalCode: row.postal_code,
        contactNumber: row.address_contact_number,
        countryId: row.country_id,
        stateId: row.state_id,
        cityId: row.city_id,
      },
      license: {
        totalLicense: row.total_license,
        usedLicense: row.used_license,
      },
      contact: {
        name: row.poc_name,
        email: row.poc_email,
        contactNumber: row.poc_contact_number,
      },
      logoUrl: row.logo_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async countChallenges(input: Record<string, any>) {
    const query = this.db('challenge_master as cm').leftJoin('challenge_visibility_mapper as cvm', 'cvm.challenge_id', 'cm.id').countDistinct('cm.id as count');

    this.applyChallengeFilters(query, input);

    const [{ count }] = await query;
    return parseInt(count as string);
  }

  applyChallengeFilters(query: Knex.QueryBuilder, input: Record<string, any>) {
    if (isDefined(input.scope)) {
      query.where('cm.scope', input.scope);
    }
    if (isDefined(input.excludeHidden)) {
      query.leftJoin('hidden_challenge as hc', function () {
        this.on('hc.challenge_id', '=', 'cm.id').andOn('hc.school_id', '=', query.client.raw('?', [input.viewerSchoolId]));
      });
      query.whereNull('hc.challenge_id');
    }
    if (isDefined(input.creatorType)) {
      query.where('cm.creator_type', input.creatorType);
    }
    if (isDefined(input.title)) {
      const safeRegex = input.title.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      const regex = `.*${safeRegex}.*`;
      query.whereRaw(`cm.title ~* ?`, [regex]);
    }
    if (isDefined(input.schoolId)) {
      query.where('cm.school_id', input.schoolId);
    }
    if (isDefined(input.challengeId)) {
      query.where({ 'bs.challenge_id': input.challengeId });
    }
    if (isDefined(input.createdBy)) {
      query.where('cm.created_by', input.createdBy);
    }
    if (isDefined(input.excludeCurrentUser)) {
      query.whereNot('cm.created_by', input.excludeCurrentUser);
    }
    if (isDefined(input.studentId)) {
      query
        .leftJoin('enrollment as e', function () {
          this.on('e.student_id', '=', query.client.raw('?', [input.studentId])).andOn('e.academic_year_id', '=', 'cm.academic_year_id');
        })
        .leftJoin('enrollment_status as es', 'es.id', 'e.enrollment_status_id')
        .where('es.code', EnrollmentStatusEnum.ACTIVE);
      query.where(function () {
        this.where('cvm.student_id', input.studentId).orWhere('cm.visibility', 'public');
      });
    }
  }

  applyChallengeAssignmentsFilters(query: Knex.QueryBuilder, input: Record<string, any>) {
    if (isDefined(input.challengeId)) {
      query.where({ 'ca.challenge_id': input.challengeId });
    }
    if (isDefined(input.name)) {
      const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      const regex = `.*${safeRegex}.*`;
      query.whereRaw(`std.name ~* ?`, [regex]);
    }
    if (isDefined(input.schoolId)) {
      query.where({ 'std.school_id': input.schoolId });
    }
    if (input.schoolGradeIds) {
      query.whereIn('std.school_grade_id', input.schoolGradeIds);
    }
    if (input.schoolSectionIds) {
      query.whereIn('std.school_section_id', input.schoolSectionIds);
    }
    if (isDefined(input.schoolGradeId)) {
      query.where({ 'std.school_grade_id': input.schoolGradeId });
    }
    if (isDefined(input.schoolSectionId)) {
      query.where({ 'std.school_section_id': input.schoolSectionId });
    }
    if (isDefined(input.participation)) {
      if (input.participation === ChallengeParticipationEnum.PARTICIPATED) {
        query.whereExists(function () {
          this.select(1).from('business as bs').whereRaw('bs.challenge_id = ca.challenge_id').andWhereRaw('bs.student_id = ca.student_id');
        });
      }
    }
  }

  applyParticipantFilters(query: Knex.QueryBuilder, input: Record<string, any>) {
    if (isDefined(input.schoolId)) {
      query.where('std.school_id', input.schoolId);
    }

    if (isDefined(input.challengeId)) {
      query.where({ 'bs.challenge_id': input.challengeId });
    }

    if (isDefined(input.schoolGradeId)) {
      query.where('std.school_grade_id', input.schoolGradeId);
    }

    if (isDefined(input.schoolSectionId)) {
      query.where('std.school_section_id', input.schoolSectionId);
    }

    if (isDefined(input.name)) {
      const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      query.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
    }

    if (isDefined(input.participation) && input.participation === ChallengeParticipationEnum.PARTICIPATED) {
      query.whereExists(function () {
        this.select(1).from('business as bs2').whereRaw('bs2.challenge_id = bs.challenge_id').andWhereRaw('bs2.student_id = bs.student_id');
      });
    }
  }

  async getChallengeStudentStatsById(input: Record<string, any>) {
    const fields = [
      'ideate',
      'problem_statement',
      'market_research',
      'market_fit',
      'prototype',
      'financial_planning',
      'branding',
      'marketing',
      'revenue_model',
      'capex',
      'opex',
      'business_model',
      'pitch_script',
      'pitch_deck',
      'pitch_feedback',
      'investment',
      'launch',
    ];

    const [row] = await this.db('challenge_master as cm')
      .select([
        this.db('challenge_assignment as ca').count('*').whereRaw('ca.challenge_id = cm.id').as('total_assigned'),

        this.db('business as b')
          .count('*')
          .leftJoin('business_progress_status as bps', 'bps.business_id', 'b.id')
          .whereRaw('b.challenge_id = cm.id')
          .andWhere((qb) => {
            fields.forEach((field) => {
              qb.orWhere(`bps.${field}`, false).orWhereNull(`bps.${field}`);
            });
          })
          .as('in_progress'),

        this.db('business as b')
          .count('*')
          .leftJoin('business_progress_status as bps', 'bps.business_id', 'b.id')
          .whereRaw('b.challenge_id = cm.id')
          .andWhere((qb) => {
            fields.forEach((field) => {
              qb.where(`bps.${field}`, true);
            });
          })
          .as('completed'),
      ])
      .where({ 'cm.id': input.challengeId });

    return {
      totalAssigned: Number(row.total_assigned),
      inProgress: Number(row.in_progress),
      completed: Number(row.completed),
    };
  }
  async hideChallenge(input: Record<string, any>) {
    await this.db('hidden_challenge')
      .insert({
        challenge_id: input.challengeId,
        school_id: input.schoolId,
      })
      .onConflict(['challenge_id', 'school_id'])
      .ignore();
  }
  async unHideChallenge(input: Record<string, any>) {
    await this.db('hidden_challenge').delete().where({
      challenge_id: input.challengeId,
      school_id: input.schoolId,
    });
  }
  async isChallengeHidden(input: Record<string, any>) {
    const [{ count }] = await this.db('hidden_challenge').count('challenge_id as count').where({
      challenge_id: input.challengeId,
      school_id: input.schoolId,
    });

    return parseInt(count as string) > 0;
  }

  async getChallengeParticipants(input: Record<string, any>) {
    let query;

    // 1. ASSIGNED: Query challenge_assignment table only
    if (input.participation === ChallengeParticipationEnum.ASSIGNED) {
      query = this.db('challenge_assignment as ca')
        .leftJoin('enrollment as e', function () {
          this.on('e.student_id', '=', 'ca.student_id').andOn('e.academic_year_id', '=', 'ca.academic_year_id');
        })
        .leftJoin('enrollment_status as es', 'es.id', 'e.enrollment_status_id')
        .where('es.code', EnrollmentStatusEnum.ACTIVE)
        .join('student as std', 'ca.student_id', 'std.id')
        .select(['std.*'])
        .distinct();

      query.modify((qb) => {
        if (isDefined(input.challengeId)) {
          qb.where('ca.challenge_id', input.challengeId);
        }

        if (isDefined(input.schoolId)) {
          qb.where('std.school_id', input.schoolId);
          if (isDefined(input.gradeId)) {
            qb.where('std.grade_id', input.gradeId);
            if (isDefined(input.sectionId)) {
              qb.where('std.section_id', input.sectionId);
            }
          }
        }

        if (isDefined(input.name)) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });
    }
    // 2. PARTICIPATED: Query business table with ideate = true only
    else if (input.participation === ChallengeParticipationEnum.PARTICIPATED) {
      query = this.db('business as b')
        .leftJoin('enrollment', function () {
          this.on('enrollment.student_id', '=', 'b.student_id').andOn('enrollment.academic_year_id', '=', 'b.ay_id');
        })
        .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
        .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
        .join('business_progress_status as bps', 'b.id', 'bps.business_id')
        .join('student as std', 'b.student_id', 'std.id')
        .select(['std.*'])
        .distinct()
        .where('b.source', 'challenge')
        .where('bps.ideate', true);

      query.modify((qb) => {
        if (isDefined(input.challengeId)) {
          qb.where('b.challenge_id', input.challengeId);
        }

        // Exclude completed (all fields true)
        qb.whereNot(function () {
          this.where('bps.problem_statement', true)
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
            .where('bps.pitch_feedback', true)
            .where('bps.investment', true)
            .where('bps.launch', true)
            .where('bps.pitch_deck', true);
        });

        if (isDefined(input.schoolId)) {
          qb.where('std.school_id', input.schoolId);
          if (isDefined(input.gradeId)) {
            qb.where('std.grade_id', input.gradeId);
            if (isDefined(input.sectionId)) {
              qb.where('std.section_id', input.sectionId);
            }
          }
        }

        if (isDefined(input.name)) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });
    }
    // 3. COMPLETED: Query business table with all status true
    else if (input.participation === ChallengeParticipationEnum.COMPLETED) {
      query = this.db('business as b')
        .leftJoin('enrollment', function () {
          this.on('enrollment.student_id', '=', 'b.student_id').andOn('enrollment.academic_year_id', '=', 'b.ay_id');
        })
        .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
        .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
        .join('business_progress_status as bps', 'b.id', 'bps.business_id')
        .join('student as std', 'b.student_id', 'std.id')
        .select(['std.*'])
        .distinct()
        .where('b.source', 'challenge')
        .where('bps.ideate', true)
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
        .where('bps.pitch_feedback', true)
        .where('bps.investment', true)
        .where('bps.launch', true)
        .where('bps.pitch_deck', true);

      query.modify((qb) => {
        if (isDefined(input.challengeId)) {
          qb.where('b.challenge_id', input.challengeId);
        }

        if (isDefined(input.schoolId)) {
          qb.where('std.school_id', input.schoolId);
          if (isDefined(input.gradeId)) {
            qb.where('std.grade_id', input.gradeId);
            if (isDefined(input.sectionId)) {
              qb.where('std.section_id', input.sectionId);
            }
          }
        }

        if (isDefined(input.name)) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });
    }
    // 4. NO FILTER: Query business table (all who started)
    else {
      query = this.db('business as b').join('student as std', 'b.student_id', 'std.id').select(['std.*']).distinct().where('b.source', 'challenge');

      query.modify((qb) => {
        if (isDefined(input.challengeId)) {
          qb.where('b.challenge_id', input.challengeId);
        }

        if (isDefined(input.schoolId)) {
          qb.where('std.school_id', input.schoolId);
          if (isDefined(input.gradeId)) {
            qb.where('std.grade_id', input.gradeId);
            if (isDefined(input.sectionId)) {
              qb.where('std.section_id', input.sectionId);
            }
          }
        }

        if (isDefined(input.name)) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });
    }

    applyOffsetPagination(query, input.offset, input.limit, 50);
    const results = await query;
    return StudentMapper.toStudents(results);
  }

  async countParticipants(input: Record<string, any>) {
    let query;

    // 1. ASSIGNED: Count from challenge_assignment table only
    if (input.participation === ChallengeParticipationEnum.ASSIGNED) {
      query = this.db('challenge_assignment as ca')
        .leftJoin('enrollment as e', function () {
          this.on('e.student_id', '=', 'ca.student_id').andOn('e.academic_year_id', '=', 'ca.academic_year_id');
        })
        .leftJoin('enrollment_status as es', 'es.id', 'e.enrollment_status_id')
        .where('es.code', EnrollmentStatusEnum.ACTIVE)
        .join('student as std', 'ca.student_id', 'std.id')
        .countDistinct('std.id as count');

      query.modify((qb) => {
        if (isDefined(input.challengeId)) {
          qb.where('ca.challenge_id', input.challengeId);
        }

        if (isDefined(input.schoolId)) {
          qb.where('std.school_id', input.schoolId);
          if (isDefined(input.gradeId)) {
            qb.where('std.grade_id', input.gradeId);
            if (isDefined(input.sectionId)) {
              qb.where('std.section_id', input.sectionId);
            }
          }
        }

        if (isDefined(input.name)) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });
    }
    // 2. PARTICIPATED: Count from business table with ideate = true only
    else if (input.participation === ChallengeParticipationEnum.PARTICIPATED) {
      query = this.db('business as b')
        .leftJoin('enrollment', function () {
          this.on('enrollment.student_id', '=', 'b.student_id').andOn('enrollment.academic_year_id', '=', 'b.ay_id');
        })
        .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
        .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
        .join('business_progress_status as bps', 'b.id', 'bps.business_id')
        .join('student as std', 'b.student_id', 'std.id')
        .countDistinct('std.id as count')
        .where('b.source', 'challenge')
        .where('bps.ideate', true);

      query.modify((qb) => {
        if (isDefined(input.challengeId)) {
          qb.where('b.challenge_id', input.challengeId);
        }

        // Exclude completed
        qb.whereNot(function () {
          this.where('bps.problem_statement', true)
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
            .where('bps.pitch_feedback', true)
            .where('bps.investment', true)
            .where('bps.launch', true)
            .where('bps.pitch_deck', true);
        });

        if (isDefined(input.schoolId)) {
          qb.where('std.school_id', input.schoolId);
          if (isDefined(input.gradeId)) {
            qb.where('std.grade_id', input.gradeId);
            if (isDefined(input.sectionId)) {
              qb.where('std.section_id', input.sectionId);
            }
          }
        }

        if (isDefined(input.name)) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });
    }
    // 3. COMPLETED: Count from business table with all status true
    else if (input.participation === ChallengeParticipationEnum.COMPLETED) {
      query = this.db('business as b')
        .leftJoin('enrollment', function () {
          this.on('enrollment.student_id', '=', 'b.student_id').andOn('enrollment.academic_year_id', '=', 'b.ay_id');
        })
        .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
        .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
        .join('business_progress_status as bps', 'b.id', 'bps.business_id')
        .join('student as std', 'b.student_id', 'std.id')
        .countDistinct('std.id as count')
        .where('b.source', 'challenge')
        .where('bps.ideate', true)
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
        .where('bps.pitch_feedback', true)
        .where('bps.investment', true)
        .where('bps.launch', true)
        .where('bps.pitch_deck', true);

      query.modify((qb) => {
        if (isDefined(input.challengeId)) {
          qb.where('b.challenge_id', input.challengeId);
        }

        if (isDefined(input.schoolId)) {
          qb.where('std.school_id', input.schoolId);
          if (isDefined(input.gradeId)) {
            qb.where('std.grade_id', input.gradeId);
            if (isDefined(input.sectionId)) {
              qb.where('std.section_id', input.sectionId);
            }
          }
        }

        if (isDefined(input.name)) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });
    }
    // 4. NO FILTER: Count from business table (all who started)
    else {
      query = this.db('business as b').join('student as std', 'b.student_id', 'std.id').countDistinct('std.id as count').where('b.source', 'challenge');

      query.modify((qb) => {
        if (isDefined(input.challengeId)) {
          qb.where('b.challenge_id', input.challengeId);
        }

        if (isDefined(input.schoolId)) {
          qb.where('std.school_id', input.schoolId);
          if (isDefined(input.gradeId)) {
            qb.where('std.grade_id', input.gradeId);
            if (isDefined(input.sectionId)) {
              qb.where('std.section_id', input.sectionId);
            }
          }
        }

        if (isDefined(input.name)) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`std.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });
    }

    const [{ count }] = await query;
    return parseInt(count as string, 10);
  }
}
