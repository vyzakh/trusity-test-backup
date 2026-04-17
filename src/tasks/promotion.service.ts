import { SchoolPromoteService } from '@application/services/school-promote.service';
import { DatabaseService, SchoolRepository } from '@infrastructure/database';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    private dbService: DatabaseService,
    private emailService: EmailService,
    private ws: WSGateway,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'promotions-check-job',
  })
  async handleSchoolPromotions() {
    await this.dbService.runUnitOfWork({
      buildDependencies: async (params) => {
        return {
          schoolRepo: new SchoolRepository(params.db),
          schoolPromoteService: new SchoolPromoteService(this.dbService, this.emailService, this.ws),
        };
      },
      callback: async (deps) => {
        const schools = await deps.schoolRepo.getSchools({});

        for (const school of schools) {
          await deps.schoolPromoteService.execute({
            data: {
              schoolId: school.id,
            },
          });
        }
      },
    });
  }
}
