import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('school', (table) => {
    table.integer('last_promotion_year');
    table.specificType('promotion_errors', 'text[]');
    table.timestamp('promotion_completed_at', { useTz: true });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('school', (table) => {
    table.dropColumn('promotion_completed_at');
    table.dropColumn('promotion_errors');
    table.dropColumn('last_promotion_year');
  });
}
