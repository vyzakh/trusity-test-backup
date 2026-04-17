import { Module } from '@nestjs/common';
import { PlatformUserResolver } from './platform-user.resolver';

@Module({
  providers: [PlatformUserResolver],
})
export class PlatformUserModule {}
