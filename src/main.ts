import { DatabaseService } from '@infrastructure/database';
import { SocketIOAdapter } from '@infrastructure/ws/socket-io.adapter';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createAppLogger } from '@presentation/graphql/shared/logger/file-logger.logger';
import { formatUnhandledPromiseReason } from '@shared/utils';
import { ConnectSessionKnexStore } from 'connect-session-knex';
import * as express from 'express';
import * as session from 'express-session';
import * as fs from 'fs';
import * as passport from 'passport';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
/*
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '..', 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'ssl', 'cert.pem')),
  };
*/
  const app = await NestFactory.create(AppModule, {
    logger: createAppLogger(),
  });

  const configService = app.get(ConfigService);
  const databaseService = app.get(DatabaseService);

  app.enableCors({
    origin: (origin: any, callback: any) => {
      const whitelistedOrigins = configService.get<string[]>('app.cors.allowedOrigins')!;

      if (!origin || whitelistedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
    maxAge: 86400,
  });

  const sessionMiddleware = session({
    store: new ConnectSessionKnexStore({
      knex: databaseService.connection,
      tableName: 'sessions',
    }),
    secret: configService.get<string>('app.cookie.secret')!,
    name: 'zoft-sess',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: false,
      httpOnly: true,
      domain: configService.get<string>('app.cookie.domain'),
    },
  });

  app.use('/public', express.static(path.join(process.cwd(), 'public')));
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  app.useWebSocketAdapter(new SocketIOAdapter(app, sessionMiddleware));

  process.removeAllListeners('warning');
  process.on('unhandledRejection', (reason) => {
    const logger = new Logger('UnhandledRejection');
    logger.error(formatUnhandledPromiseReason(reason));
  });

  await app.listen(configService.get<number>('app.port')!, configService.get<string>('app.host')!);
}

bootstrap();
