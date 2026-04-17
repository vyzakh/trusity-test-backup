import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('curriculum').del();
  await knex('enrollment_status').del();

  await knex('curriculum').insert([
    { id: 1, name: 'UK', allow_custom: false },
    { id: 2, name: 'IB', allow_custom: false },
    { id: 3, name: 'Indian', allow_custom: false },
    { id: 4, name: 'American', allow_custom: false },
    { id: 5, name: 'French', allow_custom: false },
    { id: 6, name: 'German', allow_custom: false },
    { id: 7, name: 'Canadian', allow_custom: false },
    { id: 8, name: 'Ministry of Education', allow_custom: false },
    { id: 9, name: 'Other', allow_custom: true },
  ]);

  await knex('enrollment_status').insert([
    { code: 'active', name: 'Active' },
    { code: 'promoted', name: 'Promoted' },
    { code: 'graduated', name: 'Graduated' },
    { code: 'repeated', name: 'Repeated' },
  ]);
}
