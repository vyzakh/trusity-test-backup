import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('challenge_assignment', (table) => {
    table.bigInteger('challenge_id').unsigned().notNullable();
    table.bigInteger('student_id').unsigned().notNullable();
    table.date('start_at').notNullable();
    table.date('end_at').notNullable();
    table.timestamps(true, true);

    table.primary(['challenge_id', 'student_id']);

    table.foreign('challenge_id').references('id').inTable('challenge_master').onDelete('CASCADE');
    table.foreign('student_id').references('id').inTable('student').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('challenge_assignment');
}
