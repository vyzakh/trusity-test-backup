import { Command, CommandRunner, InquirerService } from 'nest-commander';
import * as path from 'path';
import { PlatformUserRole, UserScope } from '../../../shared/enums';
import { hashPassword } from '../../../shared/utils';
import { DatabaseService } from '../../database/database.service';

@Command({
  name: 'setup',
  description: 'Trusity setup command - Initialize application',
})
export class SetupCommand extends CommandRunner {
  constructor(
    private db: DatabaseService,
    private readonly inquirer: InquirerService,
  ) {
    super();
  }

  async run(_: string[], __?: Record<string, any>): Promise<void> {
    console.log('🚀 Starting Trusity setup...');

    try {
      const answers = await this.inquirer.ask<{
        name: string;
        email: string;
        password: string;
      }>('setup', {});

      const { salt, hash } = hashPassword(answers.password);

      await this.db.runUnitOfWork({
        useTransaction: true,
        buildDependencies: async () => ({}),
        callback: async ({ db }) => {
          await db.migrate.rollback({
            directory: path.join(process.cwd(), 'src/infrastructure/database/migrations'),
          });

          await db.migrate.latest({
            directory: path.join(process.cwd(), 'src/infrastructure/database/migrations'),
          });

          await db.seed.run({
            directory: path.join(process.cwd(), 'src/infrastructure/database/seeds'),
          });

          const [userAccount] = await db('user_account').insert(
            {
              email: answers.email,
              scope: UserScope.PLATFORM_USER,
            },
            '*',
          );

          await db('platform_user').insert({
            name: answers.name,
            email: answers.email,
            user_account_id: userAccount.id,
            can_delete: false,
            role: PlatformUserRole.SUPERADMIN,
          });

          await db('user_auth').insert({
            user_account_id: userAccount.id,
            password_salt: salt,
            password_hash: hash,
          });
        },
      });

      console.log('✅ Setup completed successfully!');
    } catch (error) {
      console.log(error);
      console.error('❌ Setup failed!');
    } finally {
      process.exit(1);
    }
  }
}
