import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('student', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.bigInteger('user_account_id').unsigned().notNullable().unique().references('id').inTable('user_account').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('email', 320).unique().notNullable();
    table.string('contact_number', 20);
    table.text('avatar_url');
    table.bigInteger('school_id').unsigned().notNullable();
    table.bigInteger('current_ay_id').unsigned();
    table.integer('grade_id').unsigned();
    table.integer('section_id').unsigned();
    table.specificType('account_type', 'business_model_enum').notNullable();
    table.date('date_of_birth');
    table.string('guardian_name', 255);
    table.string('guardian_email', 320);
    table.string('guardian_contact_number', 20);
    table.timestamps(true, true);

    table.foreign('current_ay_id').references('id').inTable('academic_year').onDelete('RESTRICT');
    table.foreign(['school_id', 'grade_id', 'section_id']).references(['school_id', 'grade_id', 'section_id']).inTable('school_section').onDelete('RESTRICT');
  });

  await knex.schema.createTable('enrollment_status', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('code').notNullable().unique();
    table.string('name').notNullable();
  });

  await knex.schema.createTable('enrollment', (table) => {
    table.bigInteger('student_id').unsigned().notNullable();
    table.bigInteger('academic_year_id').unsigned().notNullable();
    table.bigInteger('school_id').unsigned().notNullable();
    table.integer('grade_id').unsigned().notNullable();
    table.integer('section_id').unsigned().notNullable();
    table.date('enrollment_date').notNullable();
    table.integer('enrollment_status_id').unsigned().notNullable();
    table.timestamps(true, true);

    table.unique(['student_id', 'academic_year_id', 'enrollment_status_id']);

    table.foreign('student_id').references('id').inTable('student').onDelete('CASCADE');
    table.foreign('academic_year_id').references('id').inTable('academic_year').onDelete('RESTRICT');
    table.foreign('enrollment_status_id').references('id').inTable('enrollment_status').onDelete('RESTRICT');
    table.foreign(['school_id', 'grade_id', 'section_id']).references(['school_id', 'grade_id', 'section_id']).inTable('school_section').onDelete('RESTRICT');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('enrollment');
  await knex.schema.dropTableIfExists('enrollment_status');
  await knex.schema.dropTableIfExists('student');
}
