import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('challenge_assignment', (table) => {
    table.bigInteger('academic_year_id').nullable().references('id').inTable('academic_year').onDelete('CASCADE');
  });

  await knex.schema.alterTable('challenge_master', (table) => {
    table.bigInteger('academic_year_id').nullable().references('id').inTable('academic_year').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('challenge_assignment', (table) => {
    table.dropColumn('academic_year_id');
  });

  await knex.schema.alterTable('challenge_master', (table) => {
    table.dropColumn('academic_year_id');
  });
}
