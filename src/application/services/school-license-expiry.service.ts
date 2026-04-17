import { DatabaseService, PlatformUserRepository, SchoolRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { School } from '@presentation/graphql/modules/school/types';
import { NotificationType } from '@shared/constants';
import { NotFoundException } from '@shared/execeptions';
import { renderTemplateString } from '@shared/utils';
import { DateTime } from 'luxon';

interface SchoolLicenseExpiryServiceInput {
  data: {
    schoolId: string;
  };
}

export class SchoolLicenseExpiryService {
  private readonly logger = new Logger(SchoolLicenseExpiryService.name);
  constructor(
    private dbService: DatabaseService,
    private emailService: EmailService,
    private ws: WSGateway,
  ) {}

  async execute(input: SchoolLicenseExpiryServiceInput) {
    const { data } = input;
    return await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const today = DateTime.now().startOf('day');
        const school = await schoolRepo.getSchool({
          schoolId: data.schoolId,
        });
        if (!school) {
          this.logger.log(`School with ID ${data.schoolId} not found. Halting license expiry check.`);
          return;
        }
        this.logger.log(`Starting license expiry check process for school: ${school.name}.`);

        if (!school.licenseExpiry) {
          this.logger.log(`No license expiry date set for school: ${school.name}`);
          return;
        }

        const expiryDate = DateTime.fromJSDate(new Date(school.licenseExpiry)).startOf('day');
        const sixMonthsBefore = expiryDate.minus({ months: 6 });
        const oneMonthBefore = expiryDate.minus({ months: 1 });
        const oneDayBefore = expiryDate.minus({ days: 1 });

        if (this.isSameDay(today, sixMonthsBefore)) {
          this.logger.log(`License for school: ${school.name} is expiring in 6 months on ${expiryDate.toISODate()}. Sending notifications.`);
          await sendLicenseExpiryNotification({
            dbService: this.dbService,
            ws: this.ws,
            emailService: this.emailService,
            school,
            expiryDate,
            period: '6months',
          });
        } else if (this.isSameDay(today, oneMonthBefore)) {
          this.logger.log(`License for school: ${school.name} is expiring in 1 month on ${expiryDate.toISODate()}. Sending notifications.`);
          await sendLicenseExpiryNotification({
            dbService: this.dbService,
            ws: this.ws,
            emailService: this.emailService,
            school,
            expiryDate,
            period: '1month',
          });
        } else if (this.isSameDay(today, oneDayBefore)) {
          this.logger.log(`License for school: ${school.name} is expiring in 1 day on ${expiryDate.toISODate()}. Sending notifications.`);
          await sendLicenseExpiryNotification({
            dbService: this.dbService,
            ws: this.ws,
            emailService: this.emailService,
            school,
            expiryDate,
            period: '1day',
          });
        }
      },
    });
  }

  private isSameDay(date1: DateTime, date2: DateTime): boolean {
    return date1.hasSame(date2, 'day');
  }
}

export async function sendLicenseExpiryNotification(input: {
  dbService: DatabaseService;
  ws: WSGateway;
  school: School;
  expiryDate: DateTime;
  period: '6months' | '1month' | '1day';
  emailService: EmailService;
}) {
  const { dbService, ws, school, expiryDate, period, emailService } = input;

  const formattedDate = expiryDate.toISODate();

  let emailSubject = '';
  let buildEmailHtml: (adminName: string) => string;

  let systemNotificationPeriod: string = '';

  switch (period) {
    case '6months': {
      emailSubject = `⏳ License Expiry Reminder. Six Months Remaining for ${school.name}`;
      buildEmailHtml = (adminName: string) => `
        <p>Hello ${adminName},</p>

        <p>
          This is a reminder that the Trupreneurs.ai license for
          <strong>${school.name}</strong> is set to expire in
          <strong>6 months</strong>.
        </p>

        <p>
          <strong>License End Date:</strong> ${formattedDate}
        </p>

        <p>
          Please review the contract details and plan the next steps
          to ensure continuity of services.
        </p>

        <p>
          Best regards,<br/>
          TruPreneurs.AI
        </p>
      `;

      systemNotificationPeriod = 'six months';
      break;
    }

    case '1month': {
      emailSubject = `⏳ License Expiry Reminder. One Month Remaining for ${school.name}`;
      buildEmailHtml = (adminName: string) => `
        <p>Hello ${adminName},</p>

        <p>
          This is a reminder that the Trupreneurs.ai license for
          <strong>${school.name}</strong> is set to expire in
          <strong>1 month</strong>.
        </p>

        <p>
          <strong>License End Date:</strong> ${formattedDate}
        </p>

        <p>
          Please review the contract details and plan the next steps
          to ensure continuity of services.
        </p>

        <p>
          Best regards,<br/>
          TruPreneurs.AI
        </p>
      `;

      systemNotificationPeriod = 'one months';
      break;
    }

    case '1day': {
      emailSubject = `⏳ License Expiry Reminder. One Day Remaining for ${school.name}`;
      buildEmailHtml = (adminName: string) => `
        <p>Hello ${adminName},</p>

        <p>
          This is a reminder that the Trupreneurs.ai license for
          <strong>${school.name}</strong> is set to expire in
          <strong>1 day</strong>.
        </p>

        <p>
          <strong>License End Date:</strong> ${formattedDate}
        </p>

        <p>
          Please review the contract details and plan the next steps
          to ensure continuity of services.
        </p>

        <p>
          Best regards,<br/>
          TruPreneurs.AI
        </p>
      `;

      systemNotificationPeriod = 'one day';
      break;
    }

    default:
      return;
  }

  await sendEmail(emailService, dbService, emailSubject, buildEmailHtml);
  await sendSystemNotification({
    dbService,
    ws: ws,
    data: {
      schoolName: school.name,
      licenseExpiryDate: formattedDate,
      period: systemNotificationPeriod,
    },
  });
}

export async function sendEmail(emailService: EmailService, dbService: DatabaseService, emailSubject: string, buildEmailHtml: (adminName: string) => string) {
  await dbService.runUnitOfWork({
    useTransaction: true,

    buildDependencies: async ({ db }) => ({
      platformUserRepo: new PlatformUserRepository(db),
    }),

    callback: async ({ platformUserRepo }) => {
      const platformUsers = await platformUserRepo.getPlatformUsers({
        permissionCodes: ['school:create', 'school:update', 'school:toggle_status'],
      });

      if (!platformUsers?.length) {
        console.log(`No platform users found to send license expiry emails.`);
        return;
      }

      await Promise.all(
        platformUsers.map(async (admin) => {
          const emailHtml = buildEmailHtml(admin.name);

          return emailService
            .sendEmail({
              to: admin.email,
              subject: emailSubject,
              html: emailHtml,
            })
            .then(EmailService.handleEmailSuccess)
            .catch(EmailService.handleEmailError);
        }),
      );
    },
  });
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; data: Record<string, any> }) {
  const { dbService, ws, data } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      platformUserRepo: new PlatformUserRepository(db),
    }),
    callback: async ({ notificationRepo, platformUserRepo }) => {
      const platformUsers = await platformUserRepo.getPlatformUsers({
        permissionCodes: ['school:create', 'school:update', 'school:toggle_status'],
      });

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.LICENSE_EXPIRY,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, data),
        data: JSON.stringify(data),
      };

      const notification = await notificationRepo.createNotification(notificationPayload);

      const notificationRecipients: Record<string, any>[] = [];

      platformUsers.forEach((platformUser) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: platformUser.userAccountId,
        });
      });

      if (notificationRecipients.length > 0) {
        await notificationRepo.crateNotificationRecipients(notificationRecipients);
        const liveRecipients = notificationRecipients.map((recipient) => ({
          id: String(recipient.userAccountId),
          reFetchNotification: true,
        }));
        ws.sendMessage(liveRecipients);
      }
    },
  });
}
