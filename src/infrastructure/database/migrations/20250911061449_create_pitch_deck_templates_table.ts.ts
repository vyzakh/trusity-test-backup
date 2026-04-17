import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('pitch_deck_templates', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('template_url').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('pitch_deck_templates');
}
