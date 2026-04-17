import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';

// types.setTypeParser(builtins.DATE, (value: any) => new Date(value).toISOString());

export function createKnexConfig(configService: ConfigService): Knex.Config {
  return {
    client: 'pg',
    connection: {
      host: configService.get('database.host'),
      port: configService.get<number>('database.port'),
      user: configService.get('database.user'),
      password: configService.get('database.password'),
      database: configService.get('database.name'),
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      tableName: 'knex_migration',
      directory: 'migrations',
      extension: 'ts',
    },
    seeds: {
      directory: 'seeds',
      extension: 'ts',
    },
  };
}
