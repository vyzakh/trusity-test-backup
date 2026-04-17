import { CommonMapper } from '@application/mappers';
import { Knex } from 'knex';

export class AiPerformanceFeedbackRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async createFeedback(input: Record<string, any>) {
    const [row] = await this.db('ai_performance_feedback').insert({ feedback: input.feedback }).returning('*');

    return CommonMapper.toAiPerformanceFeedback(row);
  }

  async getFeedbackById(input: Record<string, any>) {
    const row = await this.db('ai_performance_feedback').where({ id: input.feedbackId }).first();

    if (!row) return null;

    return CommonMapper.toAiPerformanceFeedback(row);
  }
}
