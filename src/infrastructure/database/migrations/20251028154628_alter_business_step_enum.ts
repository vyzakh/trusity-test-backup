import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TYPE business_step_enum ADD VALUE IF NOT EXISTS 'pitch_feedback'
  `);
}

export async function down(knex: Knex): Promise<void> {}
