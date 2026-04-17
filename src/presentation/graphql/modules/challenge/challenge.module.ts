import { Module } from '@nestjs/common';
import { ChallengeResolver, ChallengeTargetGradeResolver, ChallengeTargetSectionResolver } from './challenge.resolver';

@Module({
  providers: [ChallengeResolver, ChallengeTargetGradeResolver, ChallengeTargetSectionResolver],
})
export class ChallengeModule {}
