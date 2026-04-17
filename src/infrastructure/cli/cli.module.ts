import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { SetupQuestions } from './questions';
import { SetupCommand, MigrateDatabaseCommand, SeedDatabaseCommand, RollbackDatabaseCommand } from './commands';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [SetupCommand, SetupQuestions, MigrateDatabaseCommand, SeedDatabaseCommand,RollbackDatabaseCommand],
})
export class CliModule {}
