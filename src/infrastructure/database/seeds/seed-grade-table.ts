import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('grade').del();

  await knex('grade').insert(
    Array.from({ length: 9 }).map((_, index) => {
      return { id: index + 1, name: index + 5, rank: index + 1 };
    }),
  );
}
