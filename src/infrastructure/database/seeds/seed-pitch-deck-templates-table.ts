import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('pitch_deck_templates').del();

  await knex('pitch_deck_templates').insert([
    {
      id: 1,
      code: 'Template_1',
      template_url: 'https://trusity-dev-api.zoftcares.com/public/thumbnail_image_01.png',
      created_at: knex.fn.now(),
    },
    {
      id: 2,
      code: 'Template_2',
      template_url: 'https://trusity-dev-api.zoftcares.com/public/thumbnail_image_02.png',
      created_at: knex.fn.now(),
    },
    {
      id: 3,
      code: 'Template_3',
      template_url: 'https://trusity-dev-api.zoftcares.com/public/thumbnail_image_03.png',
      created_at: knex.fn.now(),
    }
  ]);
}
