import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_performance_feedback', (table) => {
    table.uuid('id', { primaryKey: true }).defaultTo(knex.raw('gen_random_uuid()'));
    table.text('feedback').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_performance_feedback');
}
