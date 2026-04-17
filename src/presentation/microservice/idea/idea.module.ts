import { Module } from '@nestjs/common';
import { IdeaListener } from './idea.listener';

@Module({
  providers: [IdeaListener],
})
export class IdeaModule {}
