import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('business_sdg', (table) => {
    table.bigInteger('business_id').unsigned().notNullable();
    table.bigInteger('sdg_id').unsigned().notNullable();

    table.primary(['business_id', 'sdg_id']);

    table.foreign('sdg_id').references('id').inTable('sdg').onDelete('CASCADE');
    table
      .foreign('business_id')
      .references('id')
      .inTable('business')
      .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('business_sdg');
}
