import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('badge_level').del();

  await knex('badge_level').insert([
    {
      level_key: 'bronze',
      display_name: 'Bronze',
      description: 'Bronze level badge',
      min_percentage: 40,
      priority: 1,
      icon_url: 'bronze.png',
      i_icon_url: 'bronze_i.png',
      e_icon_url: 'bronze_e.png',
      c_icon_url: 'bronze_c.png',
      background_color: '#C05E4033',
      primary_color: '#C05E40',
    },
    {
      level_key: 'silver',
      display_name: 'Silver',
      description: 'Silver level badge',
      min_percentage: 60,
      priority: 2,
      icon_url: 'silver.png',
      i_icon_url: 'silver_i.png',
      e_icon_url: 'silver_e.png',
      c_icon_url: 'silver_c.png',
      background_color: '#C4C4C433',
      primary_color: '#C4C4C4',
    },
    {
      level_key: 'gold',
      display_name: 'Gold',
      description: 'Gold level badge',
      min_percentage: 80,
      priority: 3,
      icon_url: 'gold.png',
      i_icon_url: 'gold_i.png',
      e_icon_url: 'gold_e.png',
      c_icon_url: 'gold_c.png',
      background_color: '#F3D28333',
      primary_color: '#F3D283',
    },
    {
      level_key: 'platinum',
      display_name: 'Platinum',
      description: 'Platinum level badge',
      min_percentage: 90,
      priority: 4,
      icon_url: 'platinum.png',
      i_icon_url: 'platinum_i.png',
      e_icon_url: 'platinum_e.png',
      c_icon_url: 'platinum_c.png',
      background_color: '#D9D9D933',
      primary_color: '#D9D9D9',
    },
  ]);
}
