import { Module } from '@nestjs/common';
import { LocalStrategy } from './strategies/local.strategy';
import { GqlLocalAuthGuard } from './guards/gql-local-auth.guard';
import { SessionSerializer } from './serializers/session.serializer';
import { PassportModule as NestPassportModule } from '@nestjs/passport';

@Module({
  imports: [NestPassportModule.register({ session: true })],
  providers: [GqlLocalAuthGuard, LocalStrategy, SessionSerializer],
})
export class PassportModule {}
