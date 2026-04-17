import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('business_progress_status', (table) => {
    table.bigInteger('business_id').primary();
    table.bigInteger('student_id').unsigned().notNullable();
    table.bigInteger('school_id').unsigned().notNullable();
    table.boolean('ideate').notNullable().defaultTo(true);
    table.boolean('problem_statement').notNullable().defaultTo(false);
    table.boolean('market_research').notNullable().defaultTo(false);
    table.boolean('market_fit').notNullable().defaultTo(false);
    table.boolean('prototype').notNullable().defaultTo(false);
    table.boolean('financial_planning').notNullable().defaultTo(false);
    table.boolean('branding').notNullable().defaultTo(false);
    table.boolean('marketing').notNullable().defaultTo(false);
    table.boolean('revenue_model').notNullable().defaultTo(false);
    table.boolean('capex').notNullable().defaultTo(false);
    table.boolean('opex').notNullable().defaultTo(false);

    table.boolean('business_model').notNullable().defaultTo(false);
    table.boolean('pitch_script').notNullable().defaultTo(false);
    table.boolean('pitch_deck').notNullable().defaultTo(false);
    table.boolean('pitch_feedback').notNullable().defaultTo(false);

    table.boolean('investment').notNullable().defaultTo(false);
    table.boolean('launch').notNullable().defaultTo(false);

    table.timestamps(true, true);

    table.foreign('business_id').references('id').inTable('business').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('business_progress_status');
}
