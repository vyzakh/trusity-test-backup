import { Module } from '@nestjs/common';
import { ReportResolver } from './resolvers/report.resolver';

@Module({
  imports: [],
  providers: [ReportResolver],
  exports: [],
})
export class ReportModule {}
