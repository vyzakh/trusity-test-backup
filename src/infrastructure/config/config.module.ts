import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule as NestConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import configurations from './configurations';

const configModuleOptions = {
  isGlobal: true,
  load: configurations,
  envFilePath: ['.env.local', '.env.dev', '.env'],
};

@Module({
  imports: [NestConfigModule.forRoot(configModuleOptions)],
  exports: [NestConfigModule],
})
export class ConfigModule {}

let cachedConfigService: ConfigService | null = null;

export async function getConfigService(): Promise<ConfigService> {
  if (cachedConfigService) {
    return cachedConfigService;
  }

  const app = await NestFactory.createApplicationContext(NestConfigModule.forRoot(configModuleOptions));

  cachedConfigService = app.get(ConfigService);
  return cachedConfigService!;
}
