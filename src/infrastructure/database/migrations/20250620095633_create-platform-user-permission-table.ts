import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('platform_user_permission', (table) => {
    table.bigInteger('platform_user_id').unsigned().notNullable();
    table.integer('permission_id').unsigned().notNullable();

    table.foreign('platform_user_id').references('id').inTable('platform_user').onDelete('CASCADE');
    table.foreign('permission_id').references('id').inTable('permission').onDelete('CASCADE');

    table.primary(['platform_user_id', 'permission_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('platform_user_permission');
}
