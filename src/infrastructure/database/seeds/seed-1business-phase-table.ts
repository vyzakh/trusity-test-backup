import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('business_phase').del();

  await knex('business_phase').insert([
    { id: 1, name: 'Innovation', code: 'innovation' },
    { id: 2, name: 'Entrepreneurship', code: 'entrepreneurship' },
    { id: 3, name: 'Communication', code: 'communication' },
  ]);
}
