import { Command, CommandRunner } from 'nest-commander';
import * as path from 'path';
import { DatabaseService } from '../../database/database.service';

@Command({
  name: 'seed:db',
  description: 'Seeds the database with initial data',
  arguments: '[file]',
})
export class SeedDatabaseCommand extends CommandRunner {
  constructor(private db: DatabaseService) {
    super();
  }

  async run(inputs: string[], __?: Record<string, any>): Promise<void> {
    const file = inputs[0];

    console.log('🌱 Starting database seeding process...');

    try {
      await this.db.runUnitOfWork({
        useTransaction: true,
        buildDependencies: async () => ({}),
        callback: async ({ db }) => {
          await db.seed.run({
            directory: path.join(process.cwd(), 'src/infrastructure/database/seeds'),
            specific: file,
          });
        },
      });

      console.log('✅ Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Database seeding failed!',error);
    } finally {
      process.exit(1);
    }
  }
}
