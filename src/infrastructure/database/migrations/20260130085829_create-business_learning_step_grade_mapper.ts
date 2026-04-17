import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('business_learning_step_grade_mapper', (table) => {
    table.increments('id').primary();

    table.bigInteger('business_learning_step_id').notNullable().references('id').inTable('business_learning_step').onDelete('CASCADE');

    table.bigInteger('grade_id').notNullable().references('id').inTable('grade').onDelete('CASCADE');

    table.unique(['business_learning_step_id', 'grade_id']);
  });

}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('business_learning_step_grade_mapper');
}
