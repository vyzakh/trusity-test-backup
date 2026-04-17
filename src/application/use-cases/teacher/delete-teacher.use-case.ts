import { ICurrentUser } from '@core/types';
import { DatabaseService, PlatformUserRepository, SchoolAdminRepository, SchoolRepository, TeacherRepository, UserAccountRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { PlatformUserRole, UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException } from '@shared/execeptions';
import { renderTemplateString } from '@shared/utils';

interface DeleteTeacherUseCaseInput {
  data: {
    teacherId: string;
  };
  user: ICurrentUser;
}

export class DeleteTeacherUseCase {
  constructor(
    private readonly dependencies: {
      userAccountRepo: UserAccountRepository;
      teacherRepo: TeacherRepository;
      platformUserRepo: PlatformUserRepository;
      notificationRepo: NotificationRepository;
      emailService: EmailService;
      dbService: DatabaseService;
      ws: WSGateway;
      schoolAdminRepo: SchoolAdminRepository;
      sessionRepo: SessionRepository;
    },
  ) {}

  async execute(input: DeleteTeacherUseCaseInput) {
    const { userAccountRepo, teacherRepo, sessionRepo, dbService, ws } = this.dependencies;
    const { data, user } = input;

    const payload = {
      teacherId: data.teacherId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const teacher = await teacherRepo.getTeacher(payload);

    if (teacher) {
      await userAccountRepo.deleteUserAccount({
        userAccountId: teacher.userAccountId,
      });

      await sessionRepo.clearSession({
        userAccountId: teacher.userAccountId,
      });
    }
    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        teacherName: teacher?.name,
        schoolId: teacher?.schoolId,
      },
    })
      .then(() => console.log(`System notification sent successfully for TECHER: ${teacher?.name}`))
      .catch((error) => console.error(`Failed to send system notification for TEACHER ${teacher?.name}. Error:`, error));
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
      schoolRepo: new SchoolRepository(db),
    }),
    callback: async ({ platformUserRepo, notificationRepo, schoolAdminRepo, schoolRepo }) => {
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
        schoolId: data.schoolId,
      };

      const [platformUsers, schoolAdmins, school] = await Promise.all([
        platformUserRepo.getPlatformUsers(operationPayload),
        schoolAdminRepo.getSchoolAdmins(operationPayload),
        schoolRepo.getSchool(operationPayload),
      ]);

      if (!school) {
        return;
      }

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        teacherName: data.teacherName,
        schoolName: school?.name,
      };

      switch (user.scope) {
        case UserScope.PLATFORM_USER: {
          Object.assign(templatePayload, {
            scopeName: 'Trusity',
          });

          if (user.role === PlatformUserRole.USER) {
            Object.assign(templatePayload, {
              scopeName: 'Trusity Admin',
            });
          }

          break;
        }
        case UserScope.SCHOOL_ADMIN: {
          Object.assign(templatePayload, {
            scopeName: 'School Admin',
          });
          break;
        }
        default: {
          throw new BadRequestException('Invalid user scope for creating a challenge');
        }
      }

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.DELETED_TEACHER,
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
        message: `Trusity has deleted Teacher ${data.teacherName}`,
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

      if (notificationRecipients.length > 0) {
        await notificationRepo.crateNotificationRecipients(notificationRecipients);
        const liveRecipients = notificationRecipients.map((teacher) => ({
          id: String(teacher.userAccountId),
          reFetchNotification: true,
        }));
        ws.sendMessage(liveRecipients);
      }
    },
  });
}
