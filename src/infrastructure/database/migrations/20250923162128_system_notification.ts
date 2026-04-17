import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('system_notification', (table) => {
    table.bigIncrements('id').primary();
    table.text('title').unique().notNullable();
    table.text('content');
    table.specificType('notify_accounts', 'JSONB').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('system_notification');
}
