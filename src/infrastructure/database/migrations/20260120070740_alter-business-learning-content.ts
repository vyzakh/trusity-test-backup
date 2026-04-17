import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('business_learning_content', (table) => {
    table.bigInteger('grade_id').nullable().references('id').inTable('grade').onDelete('CASCADE');
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('business_learning_content', (table) => {
    table.dropColumn('grade_id');
  })
}

