import * as path from 'path';
import { Command, CommandRunner } from 'nest-commander';
import { DatabaseService } from '../../database/database.service';

@Command({
  name: 'rollback:db',
  description: 'Rollback the last batch of database migrations',
})
export class RollbackDatabaseCommand extends CommandRunner {
  constructor(private db: DatabaseService) {
    super();
  }

  async run(_: string[], __?: Record<string, any>): Promise<void> {
    console.log('🔁 Rolling back the last batch of database migrations...');

    try {
      await this.db.runUnitOfWork({
        useTransaction: true,
        buildDependencies: async () => ({}),
        callback: async ({ db }) => {
          await db.migrate.rollback({
            directory: path.join(
              process.cwd(),
              'src/infrastructure/database/migrations',
            ),
          });
        },
      });

      console.log('✅ Database rollback completed successfully!');
    } catch (error) {
      console.error('❌ Database rollback failed!', error);
    } finally {
      process.exit(1);
    }
  }
}
