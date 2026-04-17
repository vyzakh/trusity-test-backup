import Knex from 'knex';
import { createKnexConfig } from './knex.config';
import { ConfigService } from '@nestjs/config';

export const createKnexInstance = (configService: ConfigService) => {
  const knexConfig = createKnexConfig(configService);

  return Knex(knexConfig);
};
