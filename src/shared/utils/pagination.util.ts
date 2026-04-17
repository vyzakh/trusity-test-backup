import { Knex } from 'knex';

export function applyOffsetPagination(query: Knex.QueryBuilder, offset?: number, limit?: number, maxLimit?: number): void {
  if (limit && limit > 0) {
    const safeLimit = maxLimit ? Math.min(limit, maxLimit) : limit;

    const safeOffset = offset && offset >= 0 ? offset : 0;

    query.limit(safeLimit);

    if (safeOffset > 0) query.offset(safeOffset);
  }
}
