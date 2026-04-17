import { appConfig } from './app.config';
import { awsConfig } from './aws.config';
import { databaseConfig } from './database.config';
import { nodemailerConfig } from './nodemailer.config';
import { rmqConfig } from './rmq.config';

export default [
  databaseConfig,
  awsConfig,
  nodemailerConfig,
  appConfig,
  rmqConfig,
];
