import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('school_curriculum', (table) => {
    table.bigInteger('school_id').unsigned().notNullable();
    table.integer('curriculum_id').unsigned().notNullable();
    table.string('name');

    table.primary(['school_id', 'curriculum_id']);

    table.foreign('school_id').references('id').inTable('school').onDelete('CASCADE');
    table.foreign('curriculum_id').references('id').inTable('curriculum').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('school_curriculum');
}
