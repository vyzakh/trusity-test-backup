import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('notification_type').insert([
    {
      id: 29,
      code: 'PHASE_UNLOCKED',
      title: 'Phase Unlocked',
      template: '**{{phaseName}}** phase is now unlocked. Jump in and continue building your business idea.',
    },
  ]);
  await knex('resource').insert([
    { id: 7, name: 'Lock Management', description: 'Lock Management', sort_order: 7 },
    { id: 8, name: 'Report Management', description: 'Report Management', sort_order: 8 },
    { id: 9, name: 'Avatar Management', description: 'Avatar Management', sort_order: 9 },
  ]);

  await knex('permission').insert([
    { id: 17, code: 'phase:toggle_lock', name: 'Lock / Unlock Phase', description: 'Allows the user to lock or unlock phase', sort_order: 1 },
    { id: 18, code: 'report:generate_and_share', name: 'Generate & Share Report', description: 'Allows the user to Generate & Share Report', sort_order: 1 },
    { id: 19, code: 'avatar:update', name: 'Update Avatar', description: 'Allows the user to lock or unlock phase', sort_order: 1 },
  ]);

  await knex('resource_permission').insert([
    { resource_id: 7, permission_id: 17 },
    { resource_id: 8, permission_id: 18 },
    { resource_id: 9, permission_id: 19 },
  ]);
}
