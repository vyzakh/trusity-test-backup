import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import { createKnexInstance } from './knex-instance';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private knex: Knex;

  constructor(private configService: ConfigService) {
    this.knex = createKnexInstance(this.configService);
  }

  get connection(): Knex {
    return this.knex;
  }

  async runUnitOfWork<TDependencies, TResult>({
    schema = undefined,
    useTransaction = false,
    transactionConfig,
    buildDependencies,
    callback,
  }: {
    schema?: string;
    useTransaction?: boolean;
    transactionConfig?: Knex.TransactionConfig;
    buildDependencies: (params: { connection: Knex; db: Knex | Knex.Transaction; schema?: string }) => Promise<TDependencies>;
    callback: (
      dependencies: TDependencies & {
        connection: Knex;
        db: Knex | Knex.Transaction;
        schema?: string;
      },
    ) => Promise<TResult>;
  }): Promise<TResult> {
    if (useTransaction) {
      return this.knex.transaction(async (trx) => {
        const dependencies = await buildDependencies({ db: trx, schema, connection: this.connection });
        return callback({ db: trx, connection: this.connection, schema, ...dependencies });
      }, transactionConfig);
    }

    const dependencies = await buildDependencies({ db: this.knex, schema, connection: this.connection });
    return callback({ db: this.knex, connection: this.knex, schema, ...dependencies });
  }

  async onModuleDestroy() {
    await this.knex.destroy();
  }
}
