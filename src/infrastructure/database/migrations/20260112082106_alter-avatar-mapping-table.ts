import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('country_avatar_mapping', (table) => {
    table.jsonb('group_1').nullable();
    table.jsonb('group_2').nullable();
    table.jsonb('group_3').nullable();
    table.jsonb('group_4').nullable();
    table.jsonb('fallback').nullable();
  });

  await knex.schema.alterTable('country_avatar_mapping', (table) => {
    table.dropColumn('fallback_head_url');
    table.dropColumn('fallback_full_scale_url');
    table.dropColumn('fallback_hand_wave_url');

    table.dropColumn('head_url');
    table.dropColumn('full_scale_url');
    table.dropColumn('hand_wave_url');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('country_avatar_mapping', (table) => {
    table.string('fallback_head_url').nullable();
    table.string('fallback_full_scale_url').nullable();
    table.string('fallback_hand_wave_url').nullable();

    table.string('head_url').nullable();
    table.string('full_scale_url').nullable();
    table.string('hand_wave_url').nullable();
  });

  await knex.schema.alterTable('country_avatar_mapping', (table) => {
    table.dropColumn('group_1');
    table.dropColumn('group_2');
    table.dropColumn('group_3');
    table.dropColumn('group_4');
    table.dropColumn('fallback');
  });
}
