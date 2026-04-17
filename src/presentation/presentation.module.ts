import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { Module } from '@nestjs/common';
import { GraphqlModule } from './graphql/graphql.module';
import { MsModule } from './microservice/ms.module';

@Module({
  imports: [InfrastructureModule, GraphqlModule, MsModule],
})
export class PresentationModule {}
