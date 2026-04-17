import { ICurrentUser } from '@core/types';
import { ChallengeRepository, DatabaseService, PlatformUserRepository, SchoolAdminRepository, TeacherRepository } from '@infrastructure/database';
import { EmailService } from '@infrastructure/email';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { ChallengeCreatorType, ChallengeParticipationEnum, ChallengeScope, ChallengeVisibility, PlatformUserRole, UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate, renderTemplateString } from '@shared/utils';
import { join } from 'path';
import { NotificationType } from '@shared/constants';
import { Logger } from '@nestjs/common';

interface DeleteChallengetUseCaseInput {
  data: {
    challengeId: string;
  };
  user: ICurrentUser;
}

export class DeleteChallengetUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      ws: WSGateway;
      emailService: EmailService;
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: DeleteChallengetUseCaseInput) {
    const { logger, dbService, ws, emailService, challengeRepo } = this.dependencies;
    const { data, user } = input;

    const deleteChallengeQuery = {
      challengeId: data.challengeId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(deleteChallengeQuery, {
          schoolId: user.schoolId,
          scope: ChallengeScope.SCHOOL,
        });
        break;
      }
      case UserScope.TEACHER: {
        Object.assign(deleteChallengeQuery, {
          schoolId: user.schoolId,
          scope: ChallengeScope.SCHOOL,
          creatorType: ChallengeCreatorType.TEACHER,
          createdBy: user.userAccountId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }
    const challenge = await challengeRepo.getChallengeById({
      challengeId: data.challengeId,
    });

    if (!challenge) throw new NotFoundException('The challenge is not found');

    let students: Record<string, any>[] = [];

    if (challenge.visibility === ChallengeVisibility.PUBLIC) {
      const participants = await challengeRepo.getChallengeParticipants({
        challengeId: challenge.id,
        participation: ChallengeParticipationEnum.PARTICIPATED,
      });

      if (participants?.length) {
        students.push(...participants);
      }
    }

    challengeRepo
      .getVisibleStudents({ challengeId: challenge.id })
      .then((visibleStudents) => {
        students.push(...visibleStudents);
      })
      .catch(console.error);

    await challengeRepo.deleteChallenge(deleteChallengeQuery);

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        challenge,
        studentsList: students,
      },
    })
      .then(() => logger.log(`System notification sent successfully for challenge: ${challenge.title}`))
      .catch((error) => logger.error(`Failed to send system notification for challenge ${challenge.title}. Error:`, error));

    sendEmailNotification({ dbService, emailService, user, data: { challenge, studentsList: students } })
      .then(EmailService.handleEmailSuccess)
      .catch(EmailService.handleEmailError);
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
      challengeRepo: new ChallengeRepository(db),
    }),
    callback: async ({ platformUserRepo, notificationRepo, schoolAdminRepo, teacherRepo, challengeRepo }) => {
      const { challenge, studentsList } = data;
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
      };

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        challengeName: challenge.title,
      };

      const studentsTemplatePayload: Record<string, any> = {
        userAccountName: ' ',
        challengeName: challenge.title,
      };

      const schoolAdminTemplatePayload: Record<string, any> = {
        userAccountName: ' ',
        challengeName: challenge.title,
      };

      switch (user.scope) {
        case UserScope.PLATFORM_USER: {
          Object.assign(templatePayload, {
            scopeName: 'Trusity',
          });
          Object.assign(studentsTemplatePayload, {
            scopeName: 'Trusity',
          });

          Object.assign(schoolAdminTemplatePayload, {
            scopeName: 'Trusity',
          });

          if (user.role === PlatformUserRole.USER) {
            Object.assign(templatePayload, {
              scopeName: 'Trusity Admin',
            });
            Object.assign(studentsTemplatePayload, {
              scopeName: 'Trusity Admin',
            });

            Object.assign(schoolAdminTemplatePayload, {
              scopeName: 'Trusity Admin',
            });
          }

          break;
        }
        case UserScope.SCHOOL_ADMIN: {
          Object.assign(templatePayload, {
            scopeName: 'School Admin',
          });
          Object.assign(studentsTemplatePayload, {
            scopeName: 'School Admin',
          });
          Object.assign(schoolAdminTemplatePayload, {
            scopeName: 'School Admin',
            userAccountName: user.name,
          });
          break;
        }
        case UserScope.TEACHER: {
          Object.assign(templatePayload, {
            scopeName: 'Teacher',
          });
          Object.assign(studentsTemplatePayload, {
            scopeName: 'Teacher',
          });
          Object.assign(schoolAdminTemplatePayload, {
            scopeName: 'Teacher',
            userAccountName: user.name,
          });
          break;
        }
        default: {
          throw new BadRequestException('Invalid user scope for creating a challenge');
        }
      }

      const isPlatformCreator = challenge.creatorType === ChallengeCreatorType.PLATFORM_USER;

      const commonPayload = {
        ...operationPayload,
        ...(isPlatformCreator ? {} : { schoolId: challenge.schoolId }),
      };

      const [platformUsers, schoolAdmins, teachers] = await Promise.all([
        platformUserRepo.getPlatformUsers(operationPayload),
        schoolAdminRepo.getSchoolAdmins(commonPayload),
        teacherRepo.getTeachers(commonPayload),
      ]);

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.DELETED_CHALLENGE,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, templatePayload),
        data: JSON.stringify({ challengeName: challenge.title }),
        createdBy: user.userAccountId,
      };

      const studentsNotificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, studentsTemplatePayload),
        data: JSON.stringify({ challengeName: challenge.title }),
        createdBy: user.userAccountId,
      };

      const schoolAdminNotificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, schoolAdminTemplatePayload),
        data: JSON.stringify({ challengeName: challenge.title }),
        createdBy: user.userAccountId,
      };

      const notification = await notificationRepo.createNotification(notificationPayload);
      const studentsNotification = await notificationRepo.createNotification(studentsNotificationPayload);
      const schoolAdminNotification = await notificationRepo.createNotification(schoolAdminNotificationPayload);
      const notificationRecipients: Record<string, any>[] = [];
      const liveRecipients: { id: string; reFetchNotification: boolean }[] = [];

      platformUsers.forEach((platformUser) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: platformUser.userAccountId,
        });
        liveRecipients.push({
          id: String(platformUser.userAccountId),
          reFetchNotification: true,
        });
      });

      schoolAdmins.forEach((schoolAdmin) => {
        notificationRecipients.push({
          notificationId: schoolAdminNotification.id,
          userAccountId: schoolAdmin.userAccountId,
        });
        liveRecipients.push({
          id: String(schoolAdmin.userAccountId),
          reFetchNotification: true,
        });
      });

      teachers.forEach((teacher) => {
        notificationRecipients.push({
          notificationId: schoolAdminNotification.id,
          userAccountId: teacher.userAccountId,
        });
        liveRecipients.push({
          id: String(teacher.userAccountId),
          reFetchNotification: true,
        });
      });

      studentsList.forEach((student) => {
        notificationRecipients.push({
          notificationId: studentsNotification.id,
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
      teacherRepo: new TeacherRepository(db),
      challengeRepo: new ChallengeRepository(db),
    }),

    callback: async ({ schoolAdminRepo, teacherRepo, challengeRepo }) => {
      const { challenge, studentsList } = data;
      const year = new Date().getFullYear();

      const isPlatformCreator = challenge.creatorType === ChallengeCreatorType.PLATFORM_USER;

      const operationPayload = {
        excludeUserAccountIds: [user.userAccountId],
        ...(isPlatformCreator ? {} : { schoolId: challenge.schoolId }),
      };

      const [schoolAdmins, teachers, students] = await Promise.all([
        schoolAdminRepo.getSchoolAdmins(operationPayload),
        teacherRepo.getTeachers(operationPayload),
        challengeRepo.getVisibleStudents({ challengeId: challenge.id }),
      ]);

      let recipients: Record<string, any>[] = [...students, ...studentsList];
      switch (user.scope) {
        case UserScope.PLATFORM_USER:
          recipients.push(...teachers, ...schoolAdmins);
          break;
        case UserScope.SCHOOL_ADMIN:
          recipients.push(...teachers);
          break;
        case UserScope.TEACHER:
          recipients.push(...schoolAdmins);
          break;
        default:
          break;
      }

      const scopeName = user.scope === UserScope.PLATFORM_USER ? 'Trusity' : user.scope === UserScope.SCHOOL_ADMIN ? 'School Admin' : 'Teacher';

      await Promise.all(
        recipients.map(async (recipient) => {
          const shouldShowDeletedByName = user.scope !== UserScope.PLATFORM_USER && ![UserScope.STUDENT, UserScope.TEACHER].includes(recipient.scope);
          const html = await compileHbsTemplate({
            templatePath: join(process.cwd(), 'src/presentation/views/challenge-delete-notification.hbs'),
            context: {
              RecipientName: recipient.name,
              ChallengeName: challenge.title,
              DeletedByRole: scopeName,
              DeletedByName: shouldShowDeletedByName ? (user.name ?? '') : '',
              // user.scope !== UserScope.PLATFORM_USER && recipient.scope !== UserScope.STUDENT && recipient.scope !== UserScope.TEACHER ? (user.name ?? '') : '',
              year,
            },
          });

          return await emailService.sendEmail({
            to: recipient.email,
            subject: 'Oops! This Challenge Has Been Withdrawn',
            html,
          });
        }),
      );
    },
  });
}
