import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('school', (table) => {
    table.integer('academic_base_year').notNullable().defaultTo(2025);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('school', (table) => {
    table.dropColumn('academic_base_year');
  });
}
