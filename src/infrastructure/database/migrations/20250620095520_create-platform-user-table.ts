import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    create type platform_role as enum (
      'superadmin',
      'user'
    )
  `);

  await knex.schema.createTable('platform_user', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.bigInteger('user_account_id').unsigned().notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('email', 320).unique().notNullable();
    table.string('contact_number', 20);
    table.text('avatar_url');
    table.specificType('role', 'platform_role').notNullable().defaultTo('user');
    table.boolean('can_delete').defaultTo(true).notNullable();
    table.timestamps(true, true);

    table.foreign('user_account_id').references('id').inTable('user_account').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('platform_user');
  await knex.raw('drop type if exists platform_role');
}
