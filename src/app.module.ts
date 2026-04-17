import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PresentationModule } from '@presentation/presentation.module';
import * as path from 'path';
import { CoreModule } from './core/core.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    TasksModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    InfrastructureModule,
    PresentationModule,
    CoreModule,
  ],
})
export class AppModule {}
