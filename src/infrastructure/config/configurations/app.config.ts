import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => {
  return {
    host: process.env.APP_HOST!,
    port: parseInt(process.env.APP_PORT!, 10),
    cookie: {
      domain: process.env.COOKIE_DOMAIN!,
      secret: process.env.COOKIE_SECRET!,
    },
    homeUrl: process.env.HOME_URL!,
    assetBaseUrl: process.env.ASSET_BASE_URL!,
    cors: {
      allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [],
    },
  };
});
