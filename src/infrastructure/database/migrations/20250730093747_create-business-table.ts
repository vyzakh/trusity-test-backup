import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    create type business_source as enum (
      'challenge',
      'direct'
    )
  `);

  await knex.raw(`
    create type business_status as enum (
      'completed',
      'in_progress'
    )
  `);

  await knex.schema.createTable('business', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.bigInteger('student_id').unsigned().notNullable();
    table.bigInteger('school_id').unsigned().notNullable();
    table.bigInteger('challenge_id').unsigned();
    table.specificType('source', 'business_source').notNullable();
    table.text('idea').notNullable();
    table.string('business_name').notNullable();

    table.text('sdgs_text').notNullable();

    table.text('problem_statement');
    table.text('problem_statement_feedback');

    table.text('target_market');
    table.text('market_research');
    table.text('market_research_data');
    table.text('market_competitors');
    table.jsonb('market_questionnaire');
    table.text('market_summary');

    table.text('market_fit');
    table.text('market_fit_feedback');

    table.boolean('is_idea_reviewed').notNullable().defaultTo(false);

    table.jsonb('prototype_option');
    table.text('prototype_description');
    table.specificType('prototype_images', 'text[]');

    table.jsonb('business_model');

    table.jsonb('revenue_model').notNullable().defaultTo('{}');
    table.jsonb('capex').notNullable().defaultTo('[]');
    table.decimal('capex_total', 15, 2).notNullable().defaultTo(0);
    table.jsonb('opex').notNullable().defaultTo('[]');
    table.jsonb('sales').notNullable().defaultTo('[]');
    table.jsonb('breakeven').notNullable().defaultTo('[]');
    table.string('breakeven_point');
    table.text('financial_plan_description');
    table.text('risks_and_mitigations');
    table.text('future_plans');
    table.jsonb('branding');
    table.text('customer_experience');
    table.text('marketing');
    table.text('competitor_analysis');
    table.text('marketing_feedback');

    table.text('launch_recommendation');
    table.text('launch_strategy');
    table.jsonb('investment');

    table.text('pitch_call_to_action');
    table.text('pitch_narrative');
    table.text('pitch_description');
    table.text('pitch_ai_generated_script');
    table.string('pitch_practice_video_url');
    table.text('pitch_ai_generated_feed_back');

    table.specificType('status', 'business_status').notNullable().defaultTo('in_progress');
    table.timestamps(true, true);

    table.timestamp('deleted_at').nullable().defaultTo(null);

    table.foreign('challenge_id').references('id').inTable('challenge_master').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('business');
  await knex.raw('drop type if exists business_source');
  await knex.raw('drop type if exists business_status');
}
