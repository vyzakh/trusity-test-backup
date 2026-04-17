import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notification_type', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('code').unique().notNullable();
    table.string('title').notNullable();
    table.text('template');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('notification', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.integer('notification_type_id').references('id').inTable('notification_type').onDelete('SET NULL');
    table.text('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('data');
    table.bigInteger('created_by').references('id').inTable('user_account').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('notification_recipient', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.bigInteger('notification_id').references('id').inTable('notification').onDelete('CASCADE').notNullable();
    table.bigInteger('user_account_id').references('id').inTable('user_account').onDelete('CASCADE').notNullable();
    table.timestamp('read_at', { useTz: true });
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('notification_recipient');
  await knex.schema.dropTable('notification');
  await knex.schema.dropTable('notification_type');
}
