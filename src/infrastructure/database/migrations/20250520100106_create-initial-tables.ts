import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    create type business_model_enum AS enum (
      'b2b',
      'b2c'
    )
  `);

  await knex.raw(`
    create type user_scope AS enum (
      'platform_user',
      'school_admin', 
      'teacher',
      'student'
    )
  `);

  await knex.schema.createTable('currency', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('name').notNullable();
    table.string('code', 3).notNullable().unique();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('grade', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('name').notNullable();
    table.integer('rank').notNullable().unique();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('section', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('name').notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('curriculum', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('name').notNullable();
    table.boolean('allow_custom').defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('sdg', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('title').notNullable().unique();
    table.text('description').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('challenge_sector', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('name').notNullable().unique();
    table.text('description').nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('drop type if exists business_model_enum');
  await knex.raw('drop type if exists user_scope');
  await knex.schema.dropTableIfExists('currency');
  await knex.schema.dropTableIfExists('grade');
  await knex.schema.dropTableIfExists('section');
  await knex.schema.dropTableIfExists('curriculum');
  await knex.schema.dropTableIfExists('sdg');
  await knex.schema.dropTableIfExists('challenge_sector');
}
