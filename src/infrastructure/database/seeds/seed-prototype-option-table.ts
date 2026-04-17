import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('prototype_option').del();

  await knex('prototype_option').insert([
    { id: 1, prototype_count: 4, name: 'Drawing' },
    { id: 2, prototype_count: 4, name: '3D' },
    { id: 3, prototype_count: 4, name: 'App Mockup' },
    { id: 4, prototype_count: 4, name: 'Wireframes' },
    { id: 5, prototype_count: 4, name: 'Sketches and Diagrams' },
    { id: 6, prototype_count: 4, name: 'Paper Interfaces' },
    { id: 7, prototype_count: 4, name: '3D Printer' },
    { id: 8, prototype_count: 4, name: 'Digital Prototypes' },
  ]);
}
