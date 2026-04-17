import { ICurrentUser } from '@core/types';
import { BusinessPhaseLockRepository, DatabaseService, SchoolAdminRepository, SchoolRepository, StudentRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { BusinessModelEnum, UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate, renderTemplateString } from '@shared/utils';
import { join } from 'path';

interface ToggleBusinessPhaseLockUseCaseInput {
  data: {
    schoolId?: string;
    gradeId?: number;
    sectionId?: number;
    studentIds?: string[];
    businessPhase: {
      phase: string;
      is_locked: boolean;
    }[];
  };
  user: ICurrentUser;
}
export class ToggleBusinessPhaseLockUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      businessPhaseLockRepo: BusinessPhaseLockRepository;
      studentRepo: StudentRepository;
      schoolRepo: SchoolRepository;
      dbService: DatabaseService;
      ws: WSGateway;
      emailService: EmailService;
    },
  ) {}

  async execute(input: ToggleBusinessPhaseLockUseCaseInput) {
    const { user, data } = input;
    const { logger, businessPhaseLockRepo, studentRepo, schoolRepo, dbService, ws, emailService } = this.dependencies;

    const payload: Record<string, any> = {
      schoolId: data.schoolId,
      studentIds: data.studentIds,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER:
        break;

      case UserScope.SCHOOL_ADMIN:
        Object.assign(payload, { schoolId: user.schoolId });
        break;

      case UserScope.TEACHER:
        Object.assign(payload, {
          schoolId: user.schoolId,
          teacherId: user.id,
        });
        break;

      default:
        throw new ForbiddenException('You are not allowed to perform this action.');
    }

    const school = await schoolRepo.getSchool({
      schoolId: payload.schoolId,
    });

    if (!school) throw new BadRequestException('School not found');

    if (school?.accountType === BusinessModelEnum.B2B) {
      if (!data.gradeId || !data.sectionId) {
        throw new BadRequestException('gradeId & sectionId are required for B2B');
      }

      if (data.businessPhase[1].is_locked === true) {
        throw new BadRequestException('Locking phases is not allowed for B2B');
      }

      this.validateSequentialLockRules(data.businessPhase);

      await businessPhaseLockRepo.unlockB2BClassPhases({
        schoolId: payload.schoolId,
        gradeId: data.gradeId,
        sectionId: data.sectionId,
        academicYearId: school.currentAYId,
        phases: data.businessPhase,
      });

      const studentIds = await studentRepo.getStudentIds({
        schoolId: payload.schoolId,
        gradeId: data.gradeId,
        sectionId: data.sectionId,
      });

      if (studentIds.length) {
        await businessPhaseLockRepo.syncStudentsFromB2BClass({
          schoolId: payload.schoolId,
          gradeId: data.gradeId,
          sectionId: data.sectionId,
          studentIds,
          academicYearId: school.currentAYId,
        });

        sendSystemNotification({
          dbService,
          ws,
          user,
          data: {
            studentIds,
            phases: data.businessPhase,
          },
        })
          .then(() => logger.log(`System notification sent successfully for phase unlock`))
          .catch((error) => logger.error(`Failed to send system notification for phase unlock. Error:`, error));

        sendEmailNotification({ dbService, emailService, user, data: { studentIds, phases: data.businessPhase } })
          .then(EmailService.handleEmailSuccess)
          .catch(EmailService.handleEmailError);
      }

      return;
    }

    if (!data.studentIds?.length) {
      throw new BadRequestException('studentIds required for B2C');
    }

    this.validateSequentialLockRules(data.businessPhase);

    await businessPhaseLockRepo.toggleB2CStudentPhaseLocks({
      studentIds: data.studentIds,
      academicYearId: school.currentAYId,
      businessPhase: data.businessPhase,
    });
  }

  private validateSequentialLockRules(phases: { phase: string; is_locked: boolean }[]) {
    const map = Object.fromEntries(phases.map((p) => [p.phase, p.is_locked]));

    // Unlock rules
    if (map.entrepreneurship === false && map.innovation === true) {
      throw new BadRequestException('Innovation must be unlocked before Entrepreneurship');
    }

    if (map.communication === false && map.entrepreneurship === true) {
      throw new BadRequestException('Entrepreneurship must be unlocked before Communication');
    }

    // Lock rules
    if (map.innovation === true && map.entrepreneurship === false) {
      throw new BadRequestException('Entrepreneurship must be locked before locking Innovation');
    }

    if (map.entrepreneurship === true && map.communication === false) {
      throw new BadRequestException('Communication must be locked before locking Entrepreneurship');
    }
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentUser; data: Record<string, any> }) {
  const { dbService, ws, user, data } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      studentRepo: new StudentRepository(db),
    }),
    callback: async ({ studentRepo, notificationRepo }) => {
      const { studentIds, phases } = data;

      const students = await studentRepo.getStudents({
        studentIds,
      });

      const phaseName = phases
        .filter((p) => !p.is_locked && p.phase !== 'innovation')
        .map((p) => p.phase.charAt(0).toUpperCase() + p.phase.slice(1))
        .join(', ');

      if (!phaseName) {
        return;
      }

      const templatePayload = {
        phaseName,
      };

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.PHASE_UNLOCKED,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, templatePayload),
        data: JSON.stringify({ phaseName }),
        createdBy: user.userAccountId,
      };

      const notification = await notificationRepo.createNotification(notificationPayload);
      const notificationRecipients: Record<string, any>[] = [];
      const liveRecipients: { id: string; reFetchNotification: boolean }[] = [];

      students.forEach((student) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: student.userAccountId,
        });
        liveRecipients.push({
          id: String(student.userAccountId),
          reFetchNotification: true,
        });
      });

      if (notificationRecipients.length > 0) {
        await notificationRepo.crateNotificationRecipients(notificationRecipients);
      }

      ws.sendMessage(liveRecipients);
    },
  });
}

async function sendEmailNotification(input: { dbService: DatabaseService; emailService: EmailService; user: ICurrentUser; data: Record<string, any> }) {
  const { dbService, emailService, user, data } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,

    buildDependencies: async ({ db }) => ({
      schoolAdminRepo: new SchoolAdminRepository(db),
      studentRepo: new StudentRepository(db),
    }),

    callback: async ({ schoolAdminRepo, studentRepo }) => {
      const { studentIds, phases } = data;
      const year = new Date().getFullYear();

      const students = await studentRepo.getStudents({
        studentIds,
      });

      const phaseName = phases
        .filter((p) => !p.is_locked && p.phase !== 'innovation')
        .map((p) => p.phase.charAt(0).toUpperCase() + p.phase.slice(1))
        .join(', ');

      if (!phaseName) {
        return;
      }

      await Promise.all(
        students.map(async (student) => {
          const html = await compileHbsTemplate({
            templatePath: join(process.cwd(), 'src/presentation/views/business-phase-unlock.hbs'),
            context: {
              studentName: student.name,
              phaseName,
            },
          });

          return await emailService.sendEmail({
            to: student.email,
            subject: "🎉 New Phase Unlocked. Let's Keep Building Your Business Idea",
            html,
          });
        }),
      );
    },
  });
}
