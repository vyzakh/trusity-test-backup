import { ICurrentUser } from '@core/types';
import { ChallengeRepository, DatabaseService, SchoolAdminRepository, StudentRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { ChallengeVisibility, PlatformUserRole, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate, renderTemplateString } from '@shared/utils';
import { join } from 'path';

interface AssignChallengeUseCaseInput {
  data: {
    challengeId: string;
    startAt: string;
    endAt: string;
    schoolId?: string;
    gradeId?: number;
    studentIds?: string[];
  };
  user: ICurrentUser;
}

export class AssignChallengeUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      studentRepo: StudentRepository;
      challengeRepo: ChallengeRepository;
      emailService: EmailService;
      ws: WSGateway;
    },
  ) {}

  async execute(input: AssignChallengeUseCaseInput) {
    const { logger, dbService, studentRepo, challengeRepo, emailService, ws } = this.dependencies;
    const { data, user } = input;

    const payload = {
      challengeId: data.challengeId,
      schoolId: data.schoolId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new BadRequestException('Invalid user scope for creating a challenge');
      }
    }

    const challenge = await challengeRepo.getChallenge({
      challengeId: payload.challengeId,
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found. The challenge with the specified ID does not exist.');
    }

    let targetStudentIds: string[] = [];

    if (user.scope !== UserScope.PLATFORM_USER) {
      if (challenge.schoolId && challenge.schoolId !== user.schoolId) {
        throw new ForbiddenException('You cannot assign challenges from another school');
      }
    }

    if (challenge.visibility === ChallengeVisibility.PRIVATE) {
      targetStudentIds = await challengeRepo.getChallengeTargetStudentIds({
        challengeId: payload.challengeId,
      });
    }

    const challengeAssignations: Record<string, any>[] = [];

    const restrictToTargetStudents = (studentIds: string[]) => {
      if (challenge.visibility === ChallengeVisibility.PRIVATE) {
        return studentIds.filter((id) => targetStudentIds.includes(id));
      }
      return studentIds;
    };
    const getStudentIds = async (query: Record<string, any>) => {
      if ([UserScope.SCHOOL_ADMIN, UserScope.TEACHER].includes(user.scope)) {
        Object.assign(query, {
          schoolId: user.schoolId,
          enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
        });
      }

      return await studentRepo.getStudentIds(query);
    };

    let studentIdsToNotify: string[] = [];

    const addAssignments = async (studentIds: string[]) => {
      const allowedStudentIds = restrictToTargetStudents(studentIds);
      studentIdsToNotify = allowedStudentIds;
      for (const studentId of allowedStudentIds) {
        const academicYear = await studentRepo.getAcademicYear({
          studentId,
        });
        challengeAssignations.push({
          challengeId: payload.challengeId,
          studentId,
          startAt: data.startAt,
          endAt: data.endAt,
          academicYearId: academicYear?.id,
        });
      }
    };

    if (data.studentIds && data.studentIds.length > 0) {
      const studentIds = await getStudentIds({
        studentIds: data.studentIds,
      });

      if (studentIds.length > 0) await addAssignments(studentIds);
    } else if (data.gradeId && payload.schoolId) {
      const studentIds = await getStudentIds({
        schoolId: data.schoolId,
        gradeId: data.gradeId,
      });

      if (studentIds.length > 0) await addAssignments(studentIds);
    } else if (data.schoolId) {
      const studentIds = await getStudentIds({
        schoolId: payload.schoolId,
      });

      if (studentIds.length > 0) await addAssignments(studentIds);
    }

    if (challengeAssignations.length > 0) {
      await challengeRepo.assignChallenge(challengeAssignations);
      sendNotification({
        dbService,
        ws: ws,
        emailService,
        user,
        studentIds: studentIdsToNotify,
        data: {
          challengeName: challenge.title,
          schoolId: user.schoolId,
        },
      })
        .then(() => logger.log(`System notification sent successfully for challenge: ${challenge.title}`))
        .catch((error) => logger.error(`Failed to send system notification for challenge ${challenge.title}. Error:`, error));
    }
  }
}

async function sendNotification(input: {
  dbService: DatabaseService;
  ws: WSGateway;
  emailService: EmailService;
  user: ICurrentUser;
  studentIds: string[];
  data: Record<string, any>;
}) {
  const { dbService, ws, emailService, user, studentIds, data } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      studentRepo: new StudentRepository(db),
      schoolAdminepo: new SchoolAdminRepository(db),
    }),
    callback: async ({ notificationRepo, studentRepo, schoolAdminepo }) => {
      const operationPayload: Record<string, any> = {
        studentIds: studentIds,
        excludeUserAccountIds: [user.userAccountId],
        schoolId: data.schoolId,
      };

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        challengeName: data.challengeName,
      };

      const schoolAdmintemplatePayload: Record<string, any> = {
        userAccountName: '',
        challengeName: data.challengeName,
      };

      switch (user.scope) {
        case UserScope.PLATFORM_USER: {
          Object.assign(templatePayload, {
            scopeName: 'Trusity',
          });
          Object.assign(schoolAdmintemplatePayload, {
            scopeName: 'Trusity',
          });

          if (user.role === PlatformUserRole.USER) {
            Object.assign(templatePayload, {
              scopeName: 'Trusity Admin',
            });
            Object.assign(schoolAdmintemplatePayload, {
              scopeName: 'Trusity Admin',
            });
          }

          break;
        }
        case UserScope.SCHOOL_ADMIN: {
          Object.assign(templatePayload, {
            scopeName: 'School Admin',
          });
          Object.assign(schoolAdmintemplatePayload, {
            scopeName: 'School Admin',
            userAccountName: user.name,
          });
          break;
        }
        case UserScope.TEACHER: {
          Object.assign(templatePayload, {
            scopeName: 'Teacher',
            userAccountName: user.name,
          });
          Object.assign(schoolAdmintemplatePayload, {
            scopeName: 'Teacher',
            userAccountName: user.name,
          });
          break;
        }
        default: {
          throw new BadRequestException('Invalid user scope for creating a challenge');
        }
      }

      const students = await studentRepo.getStudents(operationPayload);
      const schoolAdmins = await schoolAdminepo.getSchoolAdmins(operationPayload);

      Promise.all(
        students.map(async (student) => {
          const html = await compileHbsTemplate({
            templatePath: join(process.cwd(), 'src/presentation/views/challenge-assign.hbs'),
            context: {
              studentName: student.name,
              challengeName: data.challengeName,
              assignedBy: templatePayload.scopeName,
            },
          });

          return emailService
            .sendEmail({
              to: student.email,
              subject: 'Challenge Incoming – Let’s Go!',
              html,
            })
            .then(EmailService.handleEmailSuccess)
            .catch(EmailService.handleEmailError);
        }),
      );

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.ASSIGNED_CHALLENGE,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any>[] = students.map((student) => {
        // const studentPayload = { ...templatePayload, studentName: student.name };
        data.userAccountId = student.userAccountId;
        return {
          notificationTypeId: notificationType.id,
          title: notificationType.title,
          message: `You have been assigned a challenge ${templatePayload.challengeName}  by ${templatePayload.scopeName} on TruePrenuers.AI`,
          data: JSON.stringify(data),
          createdBy: user.userAccountId,
        };
      });
      const schoolAdminNotificationPayload: Record<string, any>[] = students.map((student) => {
        const schoolAdminPayload = { ...schoolAdmintemplatePayload, studentName: student.name };
        return {
          notificationTypeId: notificationType.id,
          title: notificationType.title,
          message: renderTemplateString(notificationType.template, schoolAdminPayload),
          data: JSON.stringify(data),
          createdBy: user.userAccountId,
        };
      });

      const notifications = await notificationRepo.createNotifications(notificationPayload);
      const schoolAdminNotifications = await notificationRepo.createNotifications(schoolAdminNotificationPayload);

      const notificationRecipients: Record<string, any>[] = [];

      const liveRecipients: any = [];

      students.forEach((student, index) => {
        const notification = notifications[index];
        if (notification && notification.data) {
          if (notification.data.userAccountId === student.userAccountId) {
            notificationRecipients.push({
              notificationId: notification.id,
              userAccountId: student.userAccountId,
            });
          }
        }
        liveRecipients.push({
          id: String(student.userAccountId),
          reFetchNotification: true,
        });
      });

      schoolAdmins.forEach((sa) => {
        schoolAdminNotifications.forEach((n) => {
          notificationRecipients.push({
            notificationId: n.id,
            userAccountId: sa.userAccountId,
          });
        });
        liveRecipients.push({
          id: String(sa.userAccountId),
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
