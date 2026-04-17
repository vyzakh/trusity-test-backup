import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {

  await knex('country_avatar_mapping').del();

  const countries = await knex('country').select('id');

  if (!countries.length) return;

  const rows = countries.map((country) => ({
    country_id: country.id,

    group_1: null,
    group_2: null,
    group_3: null,
    group_4: null,

    fallback: {
      "group_1": {
        "head_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-1/head.png",
        "full_scale_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-1/full-scale.png",
        "hand_wave_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-1/hand-wave.gif",
      },
      "group_2": {
        "head_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-2/head.png",
        "full_scale_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-2/full-scale.png",
        "hand_wave_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-2/hand-wave.gif",
      },
      "group_3": {
        "head_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-3/head.png",
        "full_scale_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-3/full-scale.png",
        "hand_wave_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-3/hand-wave.gif",
      },
      "group_4": {
        "head_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-4/head.png",
        "full_scale_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-4/full-scale.png",
        "hand_wave_url": "https://bkt-trusity.s3.eu-north-1.amazonaws.com/country-avatars/defaults/group-4/hand-wave.gif",
      },
    },

    is_fallback_default: true,
  }));


  await knex('country_avatar_mapping').insert(rows);
}
