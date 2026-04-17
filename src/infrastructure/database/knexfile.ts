import { getConfigService } from '../config/config.module';
import { createKnexConfig } from './knex.config';

export default async () => {
  const configService = await getConfigService();
  return createKnexConfig(configService);
};
