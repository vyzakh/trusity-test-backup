import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('resource_permission', (table) => {
    table.integer('resource_id').unsigned().notNullable();
    table.integer('permission_id').unsigned().notNullable();
    table.timestamps(true, true);

    table.foreign('resource_id').references('id').inTable('resource').onDelete('CASCADE');
    table.foreign('permission_id').references('id').inTable('permission').onDelete('CASCADE');

    table.primary(['resource_id', 'permission_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('resource_permission');
}
