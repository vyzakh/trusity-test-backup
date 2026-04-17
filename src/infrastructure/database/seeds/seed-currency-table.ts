import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('currency').del();

  await knex('currency').insert([
    { id: 1, name: 'US Dollar', code: 'USD' },
    { id: 2, name: 'Euro', code: 'EUR' },
    { id: 3, name: 'Japanese Yen', code: 'JPY' },
    { id: 4, name: 'Pound Sterling', code: 'GBP' },
    { id: 5, name: 'Australian Dollar', code: 'AUD' },
    { id: 6, name: 'Canadian Dollar', code: 'CAD' },
    { id: 7, name: 'Swiss Franc', code: 'CHF' },
    { id: 8, name: 'Chinese Renminbi', code: 'CNH' },
    { id: 9, name: 'United Arab Emirates Dirham', code: 'AED' },
    { id: 10, name: 'New Zealand Dollar', code: 'NZD' },
  ]);
}
