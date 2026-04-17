import { Module } from '@nestjs/common';
import { BadgeResolver } from './resolvers/badge.resolver';

@Module({
  imports: [],
  providers: [BadgeResolver],
  exports: [],
})
export class BadgeModule {}
