import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('section').del();

  await knex('section').insert(
    Array.from({ length: 26 }, (_, index) => ({
      id: index + 1,
      name: String.fromCharCode(65 + index),
    })),
  );
}
