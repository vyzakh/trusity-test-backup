import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('pitch_deck_templates', (table) => {
    table.renameColumn('name', 'code');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('pitch_deck_templates', (table) => {
    table.renameColumn('code', 'name');
  });
}

