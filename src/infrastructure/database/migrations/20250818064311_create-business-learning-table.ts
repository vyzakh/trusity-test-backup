import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('business_learning_phase', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('name').notNullable();
    table.string('code').unique().notNullable();
    table.integer('sort_order').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('business_learning_step', (table) => {
    table.increments('id', { primaryKey: true });
    table.integer('business_learning_phase_id').notNullable();
    table.string('code').notNullable();
    table.string('name').notNullable();
    table.integer('sort_order').notNullable().defaultTo(0);

    table.unique(['business_learning_phase_id', 'code']);

    table.foreign('business_learning_phase_id').references('id').inTable('business_learning_phase').onDelete('CASCADE');
  });

  await knex.schema.createTable('business_learning_content', (table) => {
    table.increments('id', { primaryKey: true });
    table.integer('business_learning_step_id').notNullable();
    table.string('file_url');
    table.string('mime_type');
    table.integer('sort_order').notNullable().defaultTo(1);
    table.timestamps(true, true);

    table.foreign('business_learning_step_id').references('id').inTable('business_learning_step').onDelete('CASCADE');
  });

  await knex.schema.createTable('student_business_learning_progress', (table) => {
    table.bigInteger('student_id').notNullable();
    table.integer('business_learning_content_id').notNullable();
    table.timestamps(true, true);

    table.primary(['student_id', 'business_learning_content_id']);

    table.foreign('student_id').references('id').inTable('student').onDelete('CASCADE');
    table.foreign('business_learning_content_id').references('id').inTable('business_learning_content').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('student_business_learning_progress');
  await knex.schema.dropTableIfExists('business_learning_content');
  await knex.schema.dropTableIfExists('business_learning_step');
  await knex.schema.dropTableIfExists('business_learning_phase');
}
