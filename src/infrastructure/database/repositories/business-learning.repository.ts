import { isDefined } from '@shared/utils';
import { Knex } from 'knex';

export class BusinessLearningRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async getBusinessLearningPhases() {
    const rows = await this.db('business_learning_phase').select('*').orderBy('sort_order', 'asc');

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
    }));
  }

  async getBusinessLearningSteps(input: Record<string, any>) {
    const query = this.db('business_learning_step as bls').select('bls.*').orderBy('bls.sort_order', 'asc');

    if (isDefined(input.businessLearningPhaseId)) {
      query.where({ 'bls.business_learning_phase_id': input.businessLearningPhaseId });
    }

    if (input.gradeId) {
      query.join('business_learning_step_grade_mapper as blsgm', 'bls.id', 'blsgm.business_learning_step_id').where('blsgm.grade_id', input.gradeId);
    }

    const rows = await query;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
      gradeId: input.gradeId,
    }));
  }

  async getBusinessLearningContents(input: Record<string, any>) {
    const query = this.db('business_learning_content as blc')
      .leftJoin('business_learning_step as bls', 'blc.business_learning_step_id', 'bls.id')
      .leftJoin('business_learning_phase as blp', 'bls.business_learning_phase_id', 'blp.id')
      .select(['blc.*'])
      .orderBy('blc.sort_order', 'asc')
      .orderBy('blc.id', 'asc');

    if(input.gradeId) {
      query.where('blc.grade_id', input.gradeId);
    }

    if (isDefined(input.phaseCode)) {
      query.where('blp.code', input.phaseCode);
    }
    if (isDefined(input.stepCode)) {
      query.where('bls.code', input.stepCode);
    }
    if (isDefined(input.stepId)) {
      query.where({ business_learning_step_id: input.stepId });
    }

    const rows = await query;

    return rows.map((row) => ({
      id: row.id,
      businessLearningStepId: row.business_learning_step_id,
      gradeId: row.grade_id,
      fileUrl: row.file_url,
      mimeType: row.mime_type,
      sortOrder: row.sort_order,
    }));
  }

  async deleteBusinessLearningContent(input: Record<string, any>) {
    const query = this.db('business_learning_content').del();

    if (isDefined(input.businessLearningContentId)) {
      query.where({ id: input.businessLearningContentId });
    }

    await query;
  }

  async createBusinessLearningContent(input: Record<string, any>) {
    const [row] = await this.db('business_learning_content').insert(
      {
        business_learning_step_id: input.businessLearningStepId,
        file_url: input.fileUrl,
        mime_type: input.mimeType,
        sort_order: input.sortOrder,
        grade_id: input.gradeId,
      },
      '*',
    );

    return {
      id: row.id,
      businessLearningStepId: row.business_learning_step_id,
      gradeId: row.grade_id,
      fileUrl: row.file_url,
      mimeType: row.mime_type,
      sortOrder: row.sort_order,
    };
  }

  async updateBusinessLearningContentOrders(input: Record<string, any>) {
    const businessLearningContentIds = input.contentOrders.map((contentOrder: any) => contentOrder.businessLearningContentId);

    const caseSql = input.contentOrders.map((contentOrder: any) => `WHEN ${contentOrder.businessLearningContentId} THEN ${contentOrder.sortOrder}`).join(' ');

    const rawQuery = `
      UPDATE business_learning_content
      SET sort_order = CASE id
        ${caseSql}
      END
      WHERE id IN (${businessLearningContentIds.join(',')})
    `;

    await this.db.raw(rawQuery);
  }

  async getMaxSortOrderForStep(stepId: number, gradeId?: number): Promise<number> {
    const query = this.db('business_learning_content').where({ business_learning_step_id: stepId });
    if (gradeId !== undefined) {
      query.andWhere({ grade_id: gradeId });
    }
    const result = await query.max('sort_order as maxOrder').first();
    return result?.maxOrder || 0;
  }

  async getBusinessLearningContentById(id: number) {
    const row = await this.db('business_learning_content').where({ id }).first();

    if (!row) return null;

    return {
      id: row.id,
      businessLearningStepId: row.business_learning_step_id,
      fileUrl: row.file_url,
      mimeType: row.mime_type,
      sortOrder: row.sort_order,
    };
  }

  async reorderAfterDeletion(stepId: number, deletedSortOrder: number) {
    await this.db('business_learning_content').where('business_learning_step_id', stepId).where('sort_order', '>', deletedSortOrder).decrement('sort_order', 1);
  }
}
