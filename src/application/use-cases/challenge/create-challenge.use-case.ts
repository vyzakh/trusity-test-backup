import { ICurrentUser } from '@core/types';
import {
  ChallengeRepository,
  DatabaseService,
  PlatformUserRepository,
  SchoolAdminRepository,
  SchoolRepository,
  StudentRepository,
  TeacherRepository,
} from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { ChallengeScope, ChallengeVisibility, PlatformUserRole, UserScope } from '@shared/enums';
import { BadRequestException, NotFoundException } from '@shared/execeptions';
import { renderTemplateString, sanitizeInput } from '@shared/utils';

interface CreateChallengeUseCaseInput {
  data: {
    input: {
      title: string;
      sdgIds: number[];
      companyName?: string | null;
      sectorId?: number | null;
      description?: string | null;
      visibility: ChallengeVisibility;
      expectation?: string | null;
      logoUrl?: string | null;
      targetGrades?: number[] | null;
      targetStudents?: string[] | null;
    };
  };
  user: ICurrentUser;
}

export class CreateChallengeUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      challengeRepo: ChallengeRepository;
      studentRepo: StudentRepository;
      schoolAdminRepo: SchoolAdminRepository;
      teacherRepo: TeacherRepository;
      platformUserRepo: PlatformUserRepository;
      notificationRepo: NotificationRepository;
      emailService: EmailService;
      ws: WSGateway;
    },
  ) {}

  async execute(input: CreateChallengeUseCaseInput) {
    const { logger, dbService, challengeRepo, studentRepo } = this.dependencies;
    const { data, user } = input;

    const challengePayload: Record<string, any> = {
      title: sanitizeInput(data.input.title),
      description: sanitizeInput(data.input.description),
      expectation: sanitizeInput(data.input.expectation),
      companyName: sanitizeInput(data.input.companyName),
      visibility: sanitizeInput(data.input.visibility),
      sdgIds: data.input.sdgIds,
      sectorId: data.input.sectorId,
      creatorType: user.scope,
      createdBy: user.userAccountId,
      logoUrl: sanitizeInput(data.input.logoUrl),
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        Object.assign(challengePayload, {
          scope: ChallengeScope.TRUSITY,
          schoolId: null,
        });
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        Object.assign(challengePayload, {
          scope: ChallengeScope.SCHOOL,
          schoolId: user.schoolId,
          academicYearId: user.currentSchoolAYId,
        });
        break;
      }
      default: {
        throw new BadRequestException('Invalid user scope for creating a challenge');
      }
    }

    const challenge = await challengeRepo.createChallenge(challengePayload);

    const challengeSdgs = data.input.sdgIds.map((sdgId) => {
      return { challengeId: challenge.id, sdgId };
    });

    await challengeRepo.associateChallengeSdgs(challengeSdgs);

    if (data.input.visibility === ChallengeVisibility.PRIVATE) {
      const studentIds: string[] = [];

      if (data.input.targetGrades?.length) {
        for (const gradeId of data.input.targetGrades) {
          const studentsList = await studentRepo.getStudentIds({
            schoolId: user.schoolId,
            gradeId,
            enrollmentStatus: 'active',
          });

          studentIds.push(...studentsList);
        }
      }

      if (data.input.targetStudents?.length) {
        const studentsIds = await studentRepo.getStudentIds({
          schoolId: user.schoolId,
          studentIds: data.input.targetStudents,
        });

        studentIds.push(...studentsIds);
      }

      const uniqueStudentIds = [...new Set(studentIds)];

      if (uniqueStudentIds.length) {
        await challengeRepo.addVisibility(
          uniqueStudentIds.map((studentId) => ({
            challengeId: challenge.id,
            studentId,
          })),
        );
      }
    }

    sendSystemNotification({
      dbService,
      ws: this.dependencies.ws,
      user,
      data: {
        challengeName: challenge.title,
      },
    })
      .then(() => logger.log(`System notification sent successfully for challenge: ${challenge.title}`))
      .catch((error) => logger.error(`Failed to send system notification for challenge ${challenge.title}. Error:`, error));

    return challenge;
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentUser; data: Record<string, any> }) {
  const { dbService, ws, user, data } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      platformUserRepo: new PlatformUserRepository(db),
      schoolAdminRepo: new SchoolAdminRepository(db),
      teacherRepo: new TeacherRepository(db),
      schoolRepo: new SchoolRepository(db),
    }),
    callback: async ({ platformUserRepo, notificationRepo, schoolAdminRepo, teacherRepo, schoolRepo }) => {
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
        schoolId: user?.schoolId,
      };
      const [platformUsers, schoolAdmins, teachers, school] = await Promise.all([
        platformUserRepo.getPlatformUsers(operationPayload),
        schoolAdminRepo.getSchoolAdmins(operationPayload),
        teacherRepo.getTeachers(operationPayload),
        schoolRepo.getSchool(operationPayload),
      ]);

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        challengeName: data.challengeName,
      };

      const schoolAdminPayload: Record<string, any> = {
        userAccountName: '',
        challengeName: data.challengeName,
      };

      switch (user.scope) {
        case UserScope.PLATFORM_USER: {
          Object.assign(templatePayload, {
            scopeName: 'Trusity',
          });

          Object.assign(schoolAdminPayload, {
            scopeName: 'Trusity',
          });

          if (user.role === PlatformUserRole.USER) {
            Object.assign(templatePayload, {
              scopeName: 'Trusity Admin',
            });
            Object.assign(schoolAdminPayload, {
              scopeName: 'Trusity Admin',
            });
          }

          break;
        }
        case UserScope.SCHOOL_ADMIN: {
          Object.assign(templatePayload, {
            scopeName: 'School Admin',
          });
          Object.assign(schoolAdminPayload, {
            scopeName: 'School Admin',
            userAccountName: user.name,
          });
          break;
        }
        case UserScope.TEACHER: {
          Object.assign(templatePayload, {
            scopeName: 'Teacher',
          });
          Object.assign(schoolAdminPayload, {
            scopeName: 'Teacher',
            userAccountName: user.name,
          });
          break;
        }
        default: {
          throw new BadRequestException('Invalid user scope for creating a challenge');
        }
      }

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.CREATED_CHALLENGE,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, templatePayload),
        data: JSON.stringify(data),
        createdBy: user.userAccountId,
      };

      const schoolAdminNotificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, schoolAdminPayload),
        data: JSON.stringify(data),
        createdBy: user.userAccountId,
      };

      const notification = await notificationRepo.createNotification(notificationPayload);
      const schoolAdminNotification = await notificationRepo.createNotification(schoolAdminNotificationPayload);

      const notificationRecipients: Record<string, any>[] = [];

      platformUsers.forEach((platformUser) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: platformUser.userAccountId,
        });
      });

      schoolAdmins.forEach((schoolAdmin) => {
        notificationRecipients.push({
          notificationId: schoolAdminNotification.id,
          userAccountId: schoolAdmin.userAccountId,
        });
      });

      teachers.forEach((teacher) => {
        notificationRecipients.push(
          {
            notificationId: schoolAdminNotification.id,
            userAccountId: teacher.userAccountId,
          },
        );
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
