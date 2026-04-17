import { Knex } from 'knex';

export class BadgeRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async getBadges() {
    const rows = await this.db('badge_level').select('*').orderBy('priority', 'asc');

    return rows.map((row: any) => ({
      id: row.id,
      levelKey: row.level_key,
      displayName: row.display_name,
      description: row.description,
      minPercentage: row.min_percentage,
      priority: row.priority,
      iconUrl: row.icon_url,
      iIconUrl: row.i_icon_url,
      eIconUrl: row.e_icon_url,
      cIconUrl: row.c_icon_url,
      backgroundColor: row.background_color,
      primaryColor: row.primary_color,
    }));
  }

  async updateBadges(inputs: Record<string, any>[]) {
    const bindings: any[] = [];

    const valuesSql = inputs
      .map((input) => {
        bindings.push(input.levelKey, input.minPercentage);
        return `(?, ?::float)`;
      })
      .join(', ');

    const sql = `
      UPDATE badge_level AS bl
      SET min_percentage = v.min_percentage
      FROM (VALUES ${valuesSql}) AS v(level_key, min_percentage)
      WHERE bl.level_key = v.level_key
    `;

    await this.db.raw(sql, bindings);
  }

  async getBadgeByScore(input: Record<string, any>) {
    const row = await this.db('badge_level').select('*').where('min_percentage', '<=', input.score).orderBy('priority', 'desc').first();

    if (!row) return null;

    return {
      id: row.id,
      levelKey: row.level_key,
      displayName: row.display_name,
      description: row.description,
      minPercentage: row.min_percentage,
      priority: row.priority,
      iconUrl: row.icon_url,
      iIconUrl: row.i_icon_url,
      eIconUrl: row.e_icon_url,
      cIconUrl: row.c_icon_url,
      backgroundColor: row.background_color,
      primaryColor: row.primary_color,
    };
  }
}
