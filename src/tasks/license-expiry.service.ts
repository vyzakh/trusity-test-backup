import { SchoolLicenseExpiryService } from '@application/services/school-license-expiry.service';
import { DatabaseService, SchoolRepository } from '@infrastructure/database';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LicenseExpiryService {
  private readonly logger = new Logger(LicenseExpiryService.name);

  constructor(
    private dbService: DatabaseService,
    private emailService: EmailService,
    private ws: WSGateway,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: 'license-expiry-check-job',
  })
  async handleLicenseExpiry() {
    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => {
        return {
          schoolRepo: new SchoolRepository(db),
          schoolLicenseExpiryService: new SchoolLicenseExpiryService(this.dbService, this.emailService, this.ws),
        };
      },
      callback: async ({ schoolRepo, schoolLicenseExpiryService }) => {
        const schools = await schoolRepo.getSchools({});

        for (const school of schools) {
          await schoolLicenseExpiryService.execute({
            data: {
              schoolId: school.id,
            },
          });
        }
      },
    });
  }
}
