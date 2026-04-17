import { CommonMapper } from '@application/mappers';
import { isDefined } from '@shared/utils';
import { Knex } from 'knex';

export class AcademicYearRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async getAcademicYear(input: Record<string, any>) {
    const query = this.db('academic_year as ay').select(['ay.*']);

    query.modify((qb) => {
      if (isDefined(input.schoolId)) {
        qb.where({ 'ay.school_id': input.schoolId });
      }

      if (isDefined(input.academicYearId)) {
        qb.where({ 'ay.id': input.academicYearId });
      }

      if (isDefined(input.startYear)) {
        qb.where({ 'ay.start_year': input.startYear });
      }

      if (isDefined(input.endYear)) {
        qb.where({ 'ay.end_year': input.endYear });
      }

      if (isDefined(input.startDate)) {
        qb.where({ 'ay.start_date': input.startDate });
      }

      if (isDefined(input.endDate)) {
        qb.where({ 'ay.end_date': input.endDate });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return CommonMapper.toAcademicYear(row);
  }
}
