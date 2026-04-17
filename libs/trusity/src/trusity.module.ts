import { Module } from '@nestjs/common';
import { AwsModule } from './modules/aws/aws.module';
import { BusinessModule } from './presentation/graphql/modules/business/business.module';

@Module({
  providers: [],
  exports: [AwsModule],
  imports: [AwsModule, BusinessModule],
})
export class TrusityModule {}
