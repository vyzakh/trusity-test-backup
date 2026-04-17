import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('school_section', (table) => {
    table.bigInteger('school_id').unsigned().notNullable();
    table.bigInteger('grade_id').unsigned().notNullable();
    table.integer('section_id').unsigned().notNullable();

    table.primary(['school_id', 'grade_id', 'section_id']);

    table.foreign('section_id').references('id').inTable('section').onDelete('CASCADE');
    table.foreign(['school_id', 'grade_id']).references(['school_id', 'grade_id']).inTable('school_grade').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('school_section');
}
