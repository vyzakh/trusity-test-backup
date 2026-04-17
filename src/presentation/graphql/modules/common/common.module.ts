import { Module } from '@nestjs/common';
import { CommonResolver, CountryResolver, PermissionResolver, ResourceResolver } from './common.resolver';
import { DashboardSummaryResolver } from './dashboard-summary.resolver';

@Module({
  imports: [CommonResolver, CountryResolver, ResourceResolver, PermissionResolver, DashboardSummaryResolver],
})
export class CommonModule {}
