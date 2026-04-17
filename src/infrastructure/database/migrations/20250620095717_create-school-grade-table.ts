import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('school_grade', (table) => {
    table.bigInteger('school_id').unsigned().notNullable();
    table.integer('grade_id').unsigned().notNullable();
    table.timestamps(true, true);

    table.primary(['school_id', 'grade_id']);

    table.foreign('school_id').references('id').inTable('school').onDelete('CASCADE');
    table.foreign('grade_id').references('id').inTable('grade').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('school_grade');
}
