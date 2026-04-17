import { Knex } from 'knex';

export class AppSettingsRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async getIecThreshold(): Promise<number> {
    const result = await this.db('app_settings').select('iec_threshold_value').first();

    return result?.iec_threshold_value;
  }
}
