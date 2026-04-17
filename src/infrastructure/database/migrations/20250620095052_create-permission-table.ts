import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('permission', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('code', 100).unique().notNullable();
    table.string('name', 255).notNullable();
    table.text('description');
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('permission');
}
