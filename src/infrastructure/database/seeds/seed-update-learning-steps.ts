import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    // Step 1: Shift existing steps
    await trx('business_learning_step').where('business_learning_phase_id', 2).andWhere('sort_order', '>=', 6).increment('sort_order', 2);

    // Step 2: Insert new steps
    await trx('business_learning_step')
      .insert([
        {
          id: 18,
          business_learning_phase_id: 2,
          code: 'ebitda',
          name: 'EBITDA',
          sort_order: 6,
        },
        {
          id: 19,
          business_learning_phase_id: 2,
          code: 'startup-terminologies',
          name: 'Startup Terminologies',
          sort_order: 7,
        },
      ])
      .onConflict(['business_learning_phase_id', 'code'])
      .ignore();

    // Step 3: Fetch inserted steps
    const steps = await trx('business_learning_step').select('id', 'code').whereIn('code', ['ebitda', 'startup-terminologies']);

    const stepMap = Object.fromEntries(steps.map((s) => [s.code, s.id]));

    // Step 4: Insert mappings ONLY for grades 5 & 7
    const mappings = [
      {
        business_learning_step_id: stepMap['ebitda'],
        grade_id: 5,
      },
      {
        business_learning_step_id: stepMap['ebitda'],
        grade_id: 7,
      },
      {
        business_learning_step_id: stepMap['startup-terminologies'],
        grade_id: 7,
      },
    ];

    await trx('business_learning_step_grade_mapper').insert(mappings).onConflict(['business_learning_step_id', 'grade_id']).ignore();
  });
}
