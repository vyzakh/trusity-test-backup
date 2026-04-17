import { TemplateMapper } from '@application/mappers';
import { Knex } from 'knex';

export class PitchDeckTemplatesRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async findAllPitchDeckTemplates() {
    const templates = await this.db('pitch_deck_templates').select('*');

    return TemplateMapper.toEntityList(templates);
  }

  async findPitchDeckTemplateById(id: number) {
    const templates = await this.db('pitch_deck_templates').where({id: id })
    .select('*');

    return TemplateMapper.toEntityList(templates);
  }

}
