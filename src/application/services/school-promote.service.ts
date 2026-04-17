import { getNextAcademicYear } from '@application/common';
import { DatabaseService, LookupRepository, SchoolAdminRepository, SchoolRepository, StudentRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp, renderTemplateString } from '@shared/utils';
import { DateTime } from 'luxon';
import { GradeService } from './grade.service';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';

interface SchoolPromoteServiceInput {
  data: {
    schoolId: string;
    forcePromotion?: boolean | null;
  };
}

export class SchoolPromoteService {
  private logger = new Logger(SchoolPromoteService.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly ws: WSGateway,
  ) {}

  async execute(input: SchoolPromoteServiceInput) {
    const { data } = input;

    return await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async (params) => ({
        schoolRepo: new SchoolRepository(params.db),
        studentRepo: new StudentRepository(params.db),
        gradeService: new GradeService(this.dbService),
        lookupRepo: new LookupRepository(params.db),
        sessionRepo: new SessionRepository(params.db),
      }),
      callback: async (deps) => {
        const actionAt = genTimestamp().iso;
        const today = DateTime.now().setZone('Asia/Kolkata');

        const school = await deps.schoolRepo.getSchool({
          schoolId: data.schoolId,
          isForUpdate: true,
        });

        if (!school) {
          this.logger.log(`School with ID ${data.schoolId} not found. Halting promotion check.`);
          return;
        }

        this.logger.log(`Starting promotion processing for school: ${school.name}.`);

        if (school.lastPromotionYear === today.year) {
          this.logger.log(`${school.name} already promoted in ${today.year}`);
          return;
        }

        const promotionDate = DateTime.fromObject({
          year: today.year,
          month: school.promotionStartMonth,
          day: school.promotionStartDay,
        });

        if (!data.forcePromotion && !promotionDate.hasSame(today, 'day')) {
          this.logger.log(`Skipping promotion check for ${school.name}: Promotion date (${promotionDate.toISODate()}) does not match today (${today.toISODate()}).`);
          return;
        }

        const schoolCurrentAcademicYear = await deps.schoolRepo.getCurrentAcademicYear({
          schoolId: school.id,
        });

        if (!schoolCurrentAcademicYear) {
          this.logger.error(`No current academic year found for school "${school.name}". Aborting promotion process.`);
          return;
        }

        this.logger.log(`Running promotions for ${school.name} (${promotionDate.toISODate()})`);

        const [ActiveEnrollment, PromotedEnrollment, GraduatedEnrollment] = await Promise.all([
          deps.lookupRepo.getEnrollmentStatus({
            enrollmentStatusCode: EnrollmentStatusEnum.ACTIVE,
          }),
          deps.lookupRepo.getEnrollmentStatus({
            enrollmentStatusCode: EnrollmentStatusEnum.PROMOTED,
          }),
          deps.lookupRepo.getEnrollmentStatus({
            enrollmentStatusCode: EnrollmentStatusEnum.GRADUATED,
          }),
        ]);

        if (!ActiveEnrollment || !PromotedEnrollment || !GraduatedEnrollment) {
          this.logger.log('Critical lookup data missing (Active, Promoted, or Graduated Enrollment Status). Skipping current operation.');
          return;
        }

        const nextAcademicYear = getNextAcademicYear({
          baseYear: schoolCurrentAcademicYear.startYear,
          startMonth: school.academicStartMonth,
          endMonth: school.academicEndMonth,
        });

        const schoolNextAcademicYear = await deps.schoolRepo.upsertAcademicYear({
          schoolId: school.id,
          startYear: nextAcademicYear.startYear,
          endYear: nextAcademicYear.endYear,
          startDate: nextAcademicYear.startDate,
          endDate: nextAcademicYear.endDate,
        });

        const schoolGrades = await deps.schoolRepo.getSchoolGrades({
          schoolId: school.id,
        });

        const enrolledStudents = await deps.studentRepo.getEnrollments({
          schoolId: school.id,
          academicYearId: schoolCurrentAcademicYear.id,
          enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
        });

        const graduateStudentIds: string[] = [];
        const promotionErrors: string[] = [];
        const newEnrollmentRecordsMap = new Map<string, Record<string, any>>();

        for (const enrolledStudent of enrolledStudents) {
          const currentGradeIndex = schoolGrades.findIndex((schoolGrades) => schoolGrades.grade.id === enrolledStudent.gradeId);

          if (currentGradeIndex === -1) {
            promotionErrors.push(`Student ${enrolledStudent.studentName} (${enrolledStudent.studentEmail}) — current grade missing`);
            this.logger.log(`Skipping student: Current grade ID (${enrolledStudent.gradeId}) is not mapped in school's grade list.`);
            continue;
          }

          const currentGrade = schoolGrades[currentGradeIndex];
          const nextGrade = schoolGrades[currentGradeIndex + 1];

          if (!nextGrade) {
            graduateStudentIds.push(enrolledStudent.studentId);
            continue;
          }

          if (nextGrade.grade.rank !== currentGrade.grade.rank + 1) {
            promotionErrors.push(`Student ${enrolledStudent.studentName} (${enrolledStudent.studentEmail}) (${currentGrade.grade.name} → missing next grade)`);
            this.logger.log(
              `Skipping promotion for student: Grade rank discontinuity found. Expected rank ${currentGrade.grade.rank + 1}, but found ${nextGrade.grade.rank} for the next grade.`,
            );
            continue;
          }

          const isGradeSectionExists = await deps.schoolRepo.checkSchoolGradeExists({
            schoolId: enrolledStudent.schoolId,
            gradeId: nextGrade.grade.id,
            sectionId: enrolledStudent.sectionId,
          });

          if (!isGradeSectionExists) {
            promotionErrors.push(`Student ${enrolledStudent.studentName} (${enrolledStudent.studentEmail}) (${currentGrade.grade.name} → missing next section)`);
            continue;
          }

          newEnrollmentRecordsMap.set(enrolledStudent.studentId, {
            studentId: enrolledStudent.studentId,
            schoolId: enrolledStudent.schoolId,
            academicYearId: schoolNextAcademicYear.id,
            gradeId: nextGrade.grade.id,
            sectionId: enrolledStudent.sectionId,
            enrollmentStatusId: ActiveEnrollment.id,
            enrollmentDate: actionAt,
          });
        }

        if (promotionErrors.length === 0) {
          if (graduateStudentIds.length > 0) {
            this.logger.log(`Graduating ${graduateStudentIds.length} students from ${school.name}.`);

            await deps.studentRepo.updateEnrollment({
              qSchoolId: school.id,
              qAcademicYearId: schoolCurrentAcademicYear.id,
              qStudentIds: graduateStudentIds,
              qEnrollmentStatusId: ActiveEnrollment.id,
              enrollmentStatusId: GraduatedEnrollment.id,
            });
          }

          if (newEnrollmentRecordsMap.size > 0) {
            this.logger.log(`Updating ${newEnrollmentRecordsMap.size} students to Promoted status in ${school.name}.`);

            await deps.studentRepo.updateEnrollment({
              qSchoolId: school.id,
              qAcademicYearId: schoolCurrentAcademicYear.id,
              qStudentIds: Array.from(newEnrollmentRecordsMap.keys()),
              qEnrollmentStatusId: ActiveEnrollment.id,
              enrollmentStatusId: PromotedEnrollment.id,
            });

            this.logger.log(`Creating ${newEnrollmentRecordsMap.size} new enrollment records for ${school.name}.`);

            await deps.studentRepo.bulkCreateEnrollments(Array.from(newEnrollmentRecordsMap.values()));
          }
        }

        await deps.schoolRepo.updateSchool({
          schoolId: school.id,
          currentAYId: promotionErrors.length > 0 ? schoolCurrentAcademicYear.id : schoolNextAcademicYear.id,
          lastPromotionYear: promotionErrors.length > 0 ? null : today.year,
          promotionCompletedAt: actionAt,
          promotionErrors: promotionErrors.length ? promotionErrors : null,
          updatedAt: actionAt,
        });

        if (promotionErrors.length === 0) {
          deps.sessionRepo.clearSession({
            schoolId: school.id,
          });
          this.logger.log(`Successfully promoted ${newEnrollmentRecordsMap.size} students for ${school.name}`);
        } else {
          this.logger.warn(`Promotion skipped for ${school.name} due to ${promotionErrors.length} errors.`);
        }

        sendAutoPromoteEmail({
          emailService: this.emailService,
          dbService: this.dbService,
          data: {
            schoolId: school.id,
            isPromotionSuccess: promotionErrors.length === 0,
            promotionErrors,
          },
        })
          .then(EmailService.handleEmailSuccess)
          .catch(EmailService.handleEmailError);

        sendSystemNotification({
          dbService: this.dbService,
          ws: this.ws,
          data: {
            schoolId: school.id,
            isPromotionSuccess: promotionErrors.length === 0,
          },
        })
          .then(() => console.log(`System notification sent successfully for autopomte`))
          .catch((error) => console.error(`Failed to send system notification for autopomte. Error:`, error));
      },
    });
  }
}

export async function sendAutoPromoteEmail(input: {
  emailService: EmailService;
  dbService: DatabaseService;
  data: { schoolId: string; isPromotionSuccess: boolean; promotionErrors: string[] };
}) {
  const { emailService, dbService, data } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      schoolAdminRepo: new SchoolAdminRepository(db),
    }),

    callback: async ({ schoolAdminRepo }) => {
      const schoolAdmins = await schoolAdminRepo.getSchoolAdmins({ schoolId: data.schoolId });

      if (!schoolAdmins?.length) {
        console.log(`No school admins found for schoolId: ${data.schoolId}`);
        return;
      }

      // there is success and failire templates
      const schoolAutoPromotedTemplate = `
        <p>Hi School Admin,</p>
        <p>We are pleased to inform you that students of your school have been auto-promoted to the new academic year.</p>
        <p>Please take a moment to verify the records and make any necessary changes, if required.</p>
        <p>Thank you for your attention.</p>
        <br/>
        <p>Best regards,<br/>Trupreneurs.AI</p>
      `;

      const schoolAutoPromotionFailedTemplate = `
        <p>Hi School Admin,</p>
        <p>Please note that thr Auto-promotion for your school has failed due to reason(s) mentioned below:</p>
        <ul>
          ${data.promotionErrors.map((error) => `<li>${error}</li>`).join('')}
        </ul>
        <p>Take a moment to make necessary corrections and promote them manually.</p>
        <p>Thank you for your attention.</p>
        <br/>
        <p>Best regards,<br/>Trupreneurs.AI</p>
      `;

      await Promise.all(
        schoolAdmins.map(async (admin) => {
          return emailService
            .sendEmail({
              to: admin.email,
              subject: data.isPromotionSuccess ? 'Students Auto-Promotion Completed' : 'Students Auto-Promotion Failed',
              html: data.isPromotionSuccess ? schoolAutoPromotedTemplate : schoolAutoPromotionFailedTemplate,
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
      schoolAdminRepo: new SchoolAdminRepository(db),
    }),
    callback: async ({ notificationRepo, schoolAdminRepo }) => {
      const operationPayload: Record<string, any> = {
        schoolId: data.schoolId,
      };

      const [schoolAdmins] = await Promise.all([schoolAdminRepo.getSchoolAdmins(operationPayload)]);

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: data.isPromotionSuccess ? NotificationType.PROMOTED_SCHOOL : NotificationType.SCHOOL_AUTO_PROMOTION_FAILED,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template),
        data: JSON.stringify(data),
      };

      const notification = await notificationRepo.createNotification(notificationPayload);

      const notificationRecipients: Record<string, any>[] = [];

      schoolAdmins.forEach((schoolAdmin) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: schoolAdmin.userAccountId,
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
