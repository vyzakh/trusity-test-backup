import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('permission_dependency', (table) => {
    table.integer('parent_permission_id').unsigned().notNullable();
    table.integer('child_permission_id').unsigned().notNullable();

    table.foreign('parent_permission_id').references('id').inTable('permission').onDelete('CASCADE');
    table.foreign('child_permission_id').references('id').inTable('permission').onDelete('CASCADE');

    table.primary(['parent_permission_id', 'child_permission_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('permission_dependency');
}
