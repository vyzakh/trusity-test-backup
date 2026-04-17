import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('notification_type').insert([
    {
      id: 30,
      code: 'SCHOOL_AUTO_PROMOTION_FAILED',
      title: 'Students Auto-Promotion Failed',
      template: 'Auto-promotion for your school has failed. Please make the necessary changes and promote them manually.',
    },
  ]);
}
