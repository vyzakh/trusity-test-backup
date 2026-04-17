import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('school_admin', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.bigInteger('user_account_id').unsigned().notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('email', 320).unique().notNullable();
    table.string('contact_number', 20);
    table.text('avatar_url');
    table.bigInteger('school_id').unsigned().notNullable();
    table.bigInteger('created_by').unsigned();
    table.boolean('is_primary').defaultTo(false).notNullable();
    table.timestamps(true, true);

    table.foreign('user_account_id').references('id').inTable('user_account').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('school').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('user_account').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('school_admin');
}
