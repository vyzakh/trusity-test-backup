import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('country_avatar_mapping', (table) => {
    table.bigInteger('country_id').primary().notNullable().references('id').inTable('country').onDelete('CASCADE');

    table.string('fallback_head_url').notNullable();
    table.string('fallback_full_scale_url').notNullable();
    table.string('fallback_hand_wave_url').notNullable();

    table.string('head_url').nullable();
    table.string('full_scale_url').nullable();
    table.string('hand_wave_url').nullable();

    table.boolean('is_fallback_default').notNullable().defaultTo(true);

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('country_avatar_mapping');
}
