import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE business_step_enum AS ENUM (
      'ideate',
      'problem_statement',
      'market_research',
      'market_fit',
      'prototype',
      'business_model',
      'revenue_model',
      'capex',
      'opex',
      'financial_planning',
      'branding',
      'marketing',
      'pitch_deck',
      'pitch_script',
      'pitch_video',
      'investment',
      'launch'
    )
  `);

  await knex.schema.createTable('business_step_feedback', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('business_id').unsigned().notNullable();
    table.specificType('business_step', 'business_step_enum').notNullable();
    table.bigInteger('teacher_id').unsigned().notNullable();
    table.text('feedback').notNullable();
    table.json('file_url').nullable();
    table.timestamps(true, true);

    table.foreign('business_id').references('id').inTable('business').onDelete('CASCADE');
    table.foreign('teacher_id').references('id').inTable('teacher').onDelete('CASCADE');

    table.index('business_id');
    table.index('teacher_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('business_step_feedback');
  await knex.raw(`DROP TYPE IF EXISTS business_step_enum`);
}
