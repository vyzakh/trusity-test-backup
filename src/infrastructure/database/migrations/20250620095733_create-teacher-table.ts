import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('teacher', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.bigInteger('user_account_id').unsigned().notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('email', 320).unique().notNullable();
    table.string('contact_number', 20);
    table.text('avatar_url');
    table.bigInteger('school_id').unsigned().notNullable();
    table.bigInteger('created_by').unsigned();
    table.timestamps(true, true);

    table.foreign('user_account_id').references('id').inTable('user_account').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('school').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('user_account').onDelete('SET NULL');
  });

  await knex.schema.createTable('teacher_section', (table) => {
    table.bigInteger('teacher_id').unsigned().notNullable();
    table.bigInteger('school_id').unsigned().notNullable();
    table.integer('grade_id').unsigned().notNullable();
    table.integer('section_id').unsigned().notNullable();
    table.timestamps(true, true);

    table.primary(['teacher_id', 'school_id', 'grade_id', 'section_id']);

    table.foreign('teacher_id').references('id').inTable('teacher').onDelete('CASCADE');
    table.foreign(['school_id', 'grade_id', 'section_id']).references(['school_id', 'grade_id', 'section_id']).inTable('school_section');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('teacher_section');
  await knex.schema.dropTableIfExists('teacher');
}
