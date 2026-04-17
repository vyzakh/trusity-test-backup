import { Global, Module } from '@nestjs/common';
import { AwsModule } from './aws/aws.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { MicroserviceModule } from './microservice/microservice.module';
import { PassportModule } from './passport/passport.module';
import { AppThrottlerModule } from './throttler/throttler.module';
import { WSGatewayModule } from './ws/ws.module';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule, AwsModule, EmailModule, PassportModule, MicroserviceModule, WSGatewayModule, AppThrottlerModule],
  exports: [DatabaseModule, AwsModule, EmailModule, PassportModule, MicroserviceModule, WSGatewayModule, AppThrottlerModule],
})
export class InfrastructureModule {}
