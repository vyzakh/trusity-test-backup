import { Command, CommandRunner } from 'nest-commander';
import * as path from 'path';
import { DatabaseService } from '../../database/database.service';

@Command({
  name: 'migrate:db',
  description: 'Apply all pending database migrations to update schema to latest version',
})
export class MigrateDatabaseCommand extends CommandRunner {
  constructor(private db: DatabaseService) {
    super();
  }

  async run(_: string[], __?: Record<string, any>): Promise<void> {
    console.log('🚀 Running database migrations to update schema to the latest version...');

    try {
      await this.db.runUnitOfWork({
        useTransaction: true,
        buildDependencies: async () => ({}),
        callback: async ({ db }) => {
          await db.migrate.latest({
            directory: path.join(process.cwd(), 'src/infrastructure/database/migrations'),
          });
        },
      });

      console.log('✅ Database migration completed successfully!');
    } catch (error) {
      console.error('❌ Database migration failed!', error);
    } finally {
      process.exit(1);
    }
  }
}
