import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_account', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.string('email', 255).unique().notNullable();
    table.specificType('scope', 'user_scope').notNullable();
    table.string('password_reset_token').unique().nullable();
    table.timestamp('password_reset_token_exp_at').nullable();
    table.timestamps(true, true);

    table.index('email');
    table.index('scope');
  });
  await knex.schema.createTable('user_auth', (table) => {
    table.bigInteger('user_account_id').unsigned().notNullable().primary();
    table.string('password_salt', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.timestamps(true, true);

    table.foreign('user_account_id').references('id').inTable('user_account').onDelete('CASCADE');

    table.index(['user_account_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_auth');
  await knex.schema.dropTableIfExists('user_account');
}
