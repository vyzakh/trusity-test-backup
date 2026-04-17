import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('b2c_lock_default').del();

  const phases = await knex('business_phase').select('code');

  await knex('b2c_lock_default').insert(
    phases.map((p) => ({
      phase: p.code,
      is_locked: false,
    })),
  );
}
