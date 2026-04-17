import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('business', (table) => {
    table.jsonb('ebidta').notNullable().defaultTo('[]').after('future_plans');
  });

  await knex.schema.alterTable('business_progress_status', (table) => {
    table.boolean('ebidta').notNullable().defaultTo(false).after('opex');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('business', (table) => {
    table.dropColumn('ebidta');
  });

  await knex.schema.alterTable('business_progress_status', (table) => {
    table.dropColumn('ebidta');
  });
}
