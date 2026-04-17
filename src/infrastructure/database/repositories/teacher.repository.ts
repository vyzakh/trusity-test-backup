import { TeacherMapper } from '@application/mappers/teacher.mapper';
import { BadRequestException } from '@shared/execeptions';
import { applyOffsetPagination, isDefined, isDefinedStrict } from '@shared/utils';
import { Knex } from 'knex';

export class TeacherRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async createTeacher(input: Record<string, any>) {
    try {
      const [row] = await this.db('teacher').insert(
        {
          user_account_id: input.userAccountId,
          school_id: input.schoolId,
          name: input.name,
          email: input.email,
          contact_number: input.contactNumber,
        },
        '*',
      );

      return TeacherMapper.toTeacher(row);
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'teacher_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.');
        }
      }

      throw error;
    }
  }

  async updateTeacher(input: Record<string, any>) {
    try {
      const columnsForUpdate: Record<string, string> = {
        name: 'name',
        email: 'email',
        contactNumber: 'contact_number',
        avatarUrl: 'avatar_url',
        updatedAt: 'updated_at',
      };

      const data: Record<string, any> = {};
      for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
        if (isDefined(input[inputKey])) {
          data[dbKey] = input[inputKey];
        }
      }

      const query = this.db('teacher').update(data, '*').where({
        id: input.teacherId,
      });

      if (isDefinedStrict(input.schoolId)) {
        query.where({ school_id: input.schoolId });
      }

      const [row] = await query;

      if (!row) {
        return null;
      }

      return TeacherMapper.toTeacher(row);
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint === 'teacher_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.');
        }
      }

      throw error;
    }
  }

  async getTeacher(input: Record<string, any>) {
    const query = this.db('teacher as t').join('school', 't.school_id', '=', 'school.id').select(['t.*', 'school.current_ay_id']);

    if (isDefinedStrict(input.teacherId)) {
      query.where({ 't.id': input.teacherId });
    }
    if (isDefinedStrict(input.schoolId)) {
      query.where({ 't.school_id': input.schoolId });
    }
    if (isDefinedStrict(input.userAccountId)) {
      query.where({ 't.user_account_id': input.userAccountId });
    }

    const [row] = await query;

    if (!row) {
      return null;
    }

    return TeacherMapper.toTeacher(row);
  }

  async createFeedback(input: Record<string, any>) {
    const [feedback] = await this.db('business_step_feedback').insert(
      {
        business_step: input.businessStep,
        business_id: input.businessId,
        teacher_id: input.teacherId,
        feedback: input.feedback,
        file_url: JSON.stringify(input.fileUrl || []),
        created_at: new Date(),
        updated_at: new Date(),
      },
      '*',
    );

    return {
      id: feedback.id.toString(),
      businessId: feedback.business_id,
      businessStep: feedback.business_step,
      teacherId: feedback.teacher_id,
      feedback: feedback.feedback,
      fileUrl: feedback.file_url || [],
      createdAt: feedback.created_at,
      updatedAt: feedback.updated_at,
    };
  }

  async deleteTeacherClassAssignments(input: Record<string, any>) {
    const query = this.db('teacher_section').where({ teacher_id: input.teacherId }).del();

    if (isDefinedStrict(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }

    await query;
  }

  async associateTeacherClassAssignments(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => ({
      teacher_id: input.teacherId,
      school_id: input.schoolId,
      section_id: input.sectionId,
      grade_id: input.gradeId,
    }));

    await this.db('teacher_section').insert(data);
  }

  async getTeachers(input: Record<string, any>) {
    const query = this.db('teacher as tchr').join('teacher_section as ts', 'ts.teacher_id', 'tchr.id').distinctOn('tchr.id').select(['tchr.*']);

    this.applyTeacherFilters(query, input);

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;

    return TeacherMapper.toTeachers(rows);
  }

  async countTeachers(input: Record<string, any>) {
    const totalTeachersQuery = this.db('teacher as tchr');

    this.applyTeacherFilters(totalTeachersQuery, input);

    const [{ count }] = await totalTeachersQuery.countDistinct('tchr.id as count');

    return parseInt(count as string);
  }

  async getTeacherGrades(input: Record<string, any>) {
    const query = this.db('teacher_section as ts')
      .select(['g.*', 'ts.school_id', 'ts.teacher_id'])
      .join('grade as g', 'ts.grade_id', 'g.id')
      .where({ 'ts.teacher_id': input.teacherId })
      .groupBy(['g.id', 'ts.school_id', 'ts.teacher_id']);

    if (isDefinedStrict(input.schoolId)) {
      query.where({ 'ts.school_id': input.schoolId });
    }

    const rows = await query;

    return TeacherMapper.toTeacherGrades(rows);
  }

  async getTeacherGradeSections(input: Record<string, any>) {
    const query = this.db('teacher_section as ts')
      .select(['s.*', 'ts.school_id', 'ts.teacher_id', 'ts.grade_id'])
      .join('section as s', 'ts.section_id', 's.id')
      .where({ 'ts.teacher_id': input.teacherId })
      .where({ 'ts.grade_id': input.gradeId });

    if (isDefinedStrict(input.schoolId)) {
      query.where({ 'ts.school_id': input.schoolId });
    }

    const rows = await query;

    return TeacherMapper.toTeacherGradeSections(rows);
  }

  async getTeacherGradeSectionList(input: Record<string, any>) {
    const rows = await this.db('teacher_section as ts').select(['*']).where({
      'ts.teacher_id': input.teacherId,
      'ts.school_id': input.schoolId,
    });

    return TeacherMapper.toTeacherGradeSectionList(rows);
  }

  applyTeacherFilters(query: Knex.QueryBuilder, input: Record<string, any>) {
    if (input.name) {
      const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      const regex = `.*${safeRegex}.*`;
      query.whereRaw(`tchr.name ~* ?`, [regex]);
    }

    if (input.schoolId) {
      query.where({ 'tchr.school_id': input.schoolId });
      if (input.gradeId) {
        query.where({ 'ts.grade_id': input.gradeId });
        if (input.sectionId) {
          query.where({ 'ts.section_id': input.sectionId });
        }
      }
    }

    if (input.gradeId || input.sectionId) {
      query.join('teacher_section as ts', 'ts.teacher_id', 'tchr.id');

      if (input.gradeId) {
        query.where({ 'ts.grade_id': input.gradeId });
      }

      if (input.sectionId) {
        query.where({ 'ts.section_id': input.sectionId });
      }
    }

    if (input.excludeUserAccountIds) {
      query.whereNotIn('tchr.user_account_id', input.excludeUserAccountIds);
    }
  }

  async getFeedbacks(input: Record<string, any>) {
    const query = this.db('business_step_feedback as bsf').select('bsf.*');

    if (isDefined(input.teacherId)) {
      query.where('bsf.teacher_id', input.teacherId);
    }
    if (isDefined(input.businessId)) {
      query.where('bsf.business_id', input.businessId);
    }

    if (isDefined(input.schoolId)) {
      query.join('business as b', 'bsf.business_id', 'b.id').where('b.school_id', input.schoolId);
    }

    if (isDefined(input.businessStep)) {
      query.where('bsf.business_step', input.businessStep);
    }

    query.orderBy('bsf.created_at', 'desc');

    const feedbacks = await query;

    return feedbacks.map((feedback) => ({
      id: feedback.id,
      businessStep: feedback.business_step,
      businessId: feedback.business_id,
      teacherId: feedback.teacher_id,
      feedback: feedback.feedback,
      fileUrl: feedback.file_url,
      createdAt: feedback.created_at,
      updatedAt: feedback.updated_at,
    }));
  }

  async getFeedbackById(input: Record<string, any>) {
    const [feedback] = await this.db('business_step_feedback').select('*').where('id', input.id);

    if (!feedback) {
      return null;
    }

    return {
      id: feedback.id.toString(),
      businessId: feedback.business_id,
      businessStep: feedback.business_step,
      teacherId: feedback.teacher_id.toString(),
      feedback: feedback.feedback,
      fileUrl: feedback.file_url,
      createdAt: feedback.created_at,
      updatedAt: feedback.updated_at,
    };
  }

  async updateFeedback(input: Record<string, any>) {
    const [updatedFeedback] = await this.db('business_step_feedback')
      .update({
        feedback: input.feedback,
        file_url: JSON.stringify(input.fileUrl || []),
        updated_at: new Date(),
      })
      .where('id', input.id)
      .returning('*');

    return {
      id: updatedFeedback.id,
      businessId: updatedFeedback.business_id,
      businessStep: updatedFeedback.business_step,
      teacherId: updatedFeedback.teacher_id,
      feedback: updatedFeedback.feedback,
      fileUrl: updatedFeedback.file_url || [],
      createdAt: updatedFeedback.created_at,
      updatedAt: updatedFeedback.updated_at,
    };
  }

  async deleteFeedback(input: Record<string, any>) {
    const [deletedFeedback] = await this.db('business_step_feedback').del().where('id', input.id).returning('*');

    return {
      id: deletedFeedback.id,
      businessId: deletedFeedback.business_id,
      businessStep: deletedFeedback.business_step,
      teacherId: deletedFeedback.teacher_id,
      feedback: deletedFeedback.feedback,
      fileUrl: deletedFeedback.file_url || [],
      createdAt: deletedFeedback.created_at,
      updatedAt: deletedFeedback.updated_at,
    };
  }
}
