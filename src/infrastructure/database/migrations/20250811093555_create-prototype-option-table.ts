import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('prototype_option', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('name').notNullable().unique();
    table.integer('prototype_count').notNullable().defaultTo(1);
    table.boolean('is_visible').notNullable().defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('prototype_option');
}
