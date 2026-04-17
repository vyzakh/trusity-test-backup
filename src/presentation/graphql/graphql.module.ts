import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ExceptionsFilter } from '@presentation/graphql/filters/exceptions.filter';
import { GqlSessionAuthGuard } from '@shared/guards/gql-session-auth.guard';
import { GraphQLExceptionFilter } from './filters';
import { AuthModule } from './modules/auth/auth.module';
import { BadgeModule } from './modules/badge/badge.module';
import { BusinessModule } from './modules/business/business.module';
import { ChallengeModule } from './modules/challenge/challenge.module';
import { CommonModule } from './modules/common/common.module';
import { MediaModule } from './modules/media/media.module';
import { PlatformUserModule } from './modules/platform-user/platform-user.module';
import { ReportModule } from './modules/report/report.module';
import { SchoolModule } from './modules/school/school.module';
import { StudentModule } from './modules/student/student.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import './shared/enum';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      introspection: true,
      driver: ApolloDriver,
      context: ({ req, res }) => ({ req, res }),
      playground: true,
     // plugins: [ApolloServerPluginLandingPageLocalDefault()],
      autoSchemaFile: true,
    }),
    CommonModule,
    SchoolModule,
    MediaModule,
    StudentModule,
    TeacherModule,
    ChallengeModule,
    AuthModule,
    BusinessModule,
    PlatformUserModule,
    ReportModule,
    BadgeModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlSessionAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: GraphQLExceptionFilter,
    },
  ],
})
export class GraphqlModule {}
