import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('hidden_challenge', (table) => {
    table.bigInteger('challenge_id').unsigned().notNullable();
    table.bigInteger('school_id').unsigned().notNullable();

    table.primary(['challenge_id', 'school_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('hidden_challenge');
}
