import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('business_learning_step_grade_mapper').del();
  
  await knex.raw(`
    INSERT INTO business_learning_step_grade_mapper (
      business_learning_step_id,
      grade_id
    )
    SELECT
      bls.id,
      g.id
    FROM business_learning_step bls
    CROSS JOIN grade g
    ON CONFLICT (business_learning_step_id, grade_id) DO NOTHING;
  `);
}
