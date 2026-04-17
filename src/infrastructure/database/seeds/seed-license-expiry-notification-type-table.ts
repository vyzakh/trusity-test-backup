import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('notification_type').insert([
    {
      id: 28,
      code: 'LICENSE_EXPIRY',
      title: 'License Expiry',
      template: 'Trupreneurs.ai platform license for **{{schoolName}}** will expire in **{{period}}** on **{{licenseExpiryDate}}**. Please review and plan next steps.',
    },
  ]);
}
