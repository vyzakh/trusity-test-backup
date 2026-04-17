import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('startup_terminologies', (table) => {
    table.increments('id').primary();
    table.string('category').notNullable();
    table.jsonb('data').notNullable().defaultTo([]);
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('startup_terminologies');
}

