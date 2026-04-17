import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('app_settings').del();

  await knex('app_settings').insert([
    {
      iec_threshold_value: 80,
    },
  ]);
}
