import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('challenge_sector').del();

  await knex('challenge_sector').insert([
    { id: 1, name: 'FMCG', description: '' },
    { id: 2, name: 'Medical', description: '' },
    { id: 3, name: 'Engineering', description: '' },
    { id: 4, name: 'Technology', description: '' },
    { id: 5, name: 'STEM', description: '' },
    { id: 6, name: 'Finance', description: '' },
    { id: 7, name: 'FinTech', description: '' },
    { id: 8, name: 'EdTech', description: '' },
    { id: 9, name: 'Education', description: '' },
    { id: 10, name: 'AgriTech', description: '' },
    { id: 11, name: 'Retail', description: '' },
    { id: 12, name: 'Marketing', description: '' },
    { id: 13, name: 'Data Analytics', description: '' },
    { id: 14, name: 'Sustainability', description: '' },
    { id: 15, name: 'E-Commerce', description: '' },
    { id: 16, name: 'Other', description: '' },
  ]);
}
