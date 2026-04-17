import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('business_progress_score', (table) => {
    table.bigInteger('business_id').primary();
    table.bigInteger('student_id').unsigned().notNullable();
    table.bigInteger('school_id').unsigned().notNullable();
    table.float('problem_statement').defaultTo(null);
    table.float('market_research').defaultTo(null);
    table.float('market_fit').defaultTo(null);
    table.float('prototype').defaultTo(null);
    table.float('financial_planning').defaultTo(null);
    table.float('marketing').defaultTo(null);

    table.float('business_model').defaultTo(null);
    table.float('pitch_feedback').defaultTo(null);
    table.timestamps(true, true);

    table.foreign('business_id').references('id').inTable('business').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('business_progress_score');
}
