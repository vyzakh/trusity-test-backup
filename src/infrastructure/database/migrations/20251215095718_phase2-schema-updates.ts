import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('business', (table) => {
    table.bigInteger('ay_id').unsigned();
    table.integer('grade_id').unsigned();
    table.integer('section_id').unsigned();

    table.foreign('ay_id').references('id').inTable('academic_year').onDelete('SET NULL');
    table.foreign(['school_id', 'grade_id', 'section_id']).references(['school_id', 'grade_id', 'section_id']).inTable('school_section').onDelete('SET NULL');
  });

  await knex.schema.createTable('badge_level', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.string('level_key').notNullable().unique();
    table.string('display_name').notNullable();
    table.text('description');
    table.string('icon_url');
    table.string('i_icon_url');
    table.string('e_icon_url');
    table.string('c_icon_url');
    table.decimal('min_percentage', 5, 2).notNullable().unique();
    table.integer('priority').notNullable().unique();
    table.string('background_color');
    table.string('primary_color');
    table.timestamps(true, true);

    table.check('(min_percentage >= 0 AND min_percentage <= 100)');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('business', (table) => {
    table.dropColumn('ay_id');
    table.dropColumn('grade_id');
    table.dropColumn('section_id');
  });

  await knex.schema.dropTable('badge_level');
}
