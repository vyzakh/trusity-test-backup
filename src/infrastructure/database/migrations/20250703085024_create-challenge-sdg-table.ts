import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('challenge_sdg', (table) => {
    table.bigInteger('challenge_id').unsigned().notNullable();
    table.bigInteger('sdg_id').unsigned().notNullable();

    table.primary(['challenge_id', 'sdg_id']);

    table
      .foreign('challenge_id')
      .references('id')
      .inTable('challenge_master')
      .onDelete('CASCADE');
    table.foreign('sdg_id').references('id').inTable('sdg').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('challenge_sdg');
}
