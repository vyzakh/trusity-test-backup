import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('resource').insert([{ id: 6, name: 'Badge management', description: 'Badge management', sort_order: 6 }]);

  await knex('permission').insert([{ id: 16, code: 'badge:update', name: 'Update Badge', description: 'Allows the user to update badge information.', sort_order: 1 }]);

  await knex('resource_permission').insert([{ resource_id: 6, permission_id: 16 }]);
}
