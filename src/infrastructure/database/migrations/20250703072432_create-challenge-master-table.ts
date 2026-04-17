import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    create type challenge_scope as enum (
      'trusity',
      'school'
    )
  `);

  await knex.raw(`
    create type challenge_creator_type as enum (
      'platform_user',
      'school_admin', 
      'teacher'
    )
  `);

  await knex.raw(`
    create type challenge_visibility_enum as enum (
      'public',
      'private'
    )
  `);

  await knex.schema.createTable('challenge_master', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.string('title').notNullable();
    table.string('company_name');
    table.integer('sector_id');
    table.text('description');
    table.text('expectation');
    table.specificType('sdg_ids', 'int[]').notNullable();
    table.specificType('scope', 'challenge_scope').notNullable();
    table.specificType('creator_type', 'challenge_creator_type').notNullable();
    table.bigInteger('created_by').unsigned().notNullable();
    table.bigInteger('school_id').unsigned();
    table.specificType('visibility', 'challenge_visibility_enum').notNullable().defaultTo('public');
    table.text('logo_url');
    table.timestamps(true, true);

    table.foreign('sector_id').references('id').inTable('challenge_sector').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('user_account').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('school').onDelete('CASCADE');
  });

  await knex.schema.createTable('challenge_visibility_mapper', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.bigInteger('challenge_id').unsigned().notNullable();
    table.bigInteger('student_id').unsigned().notNullable();
    table.timestamps(true, true);

    table.foreign('challenge_id').references('id').inTable('challenge_master').onDelete('CASCADE');

    table.foreign('student_id').references('id').inTable('student').onDelete('CASCADE');

    table.unique(['challenge_id', 'student_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('challenge_visibility_mapper');
  await knex.schema.dropTableIfExists('challenge_master');
  await knex.raw('drop type if exists challenge_creator_type');
  await knex.raw('drop type if exists challenge_scope');
  await knex.raw('drop type if exists challenge_visibility_enum');
}
