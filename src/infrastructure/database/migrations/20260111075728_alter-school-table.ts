import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('school', (table) => {
    table.date('license_expiry').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('school', (table) => {
    table.dropColumn('license_expiry');
  });
}

