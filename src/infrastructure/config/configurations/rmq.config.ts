import { registerAs } from '@nestjs/config';

export const rmqConfig = registerAs('rmq', () => {
  return {
    uri: process.env.AMPQ_CONNECTION_URI!,
  };
});
