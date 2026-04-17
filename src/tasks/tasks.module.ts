import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PromotionService } from './promotion.service';
import { LicenseExpiryService } from './license-expiry.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [PromotionService, LicenseExpiryService],
})
export class TasksModule {}
