import {
  BusinessRepository,
  ChallengeRepository,
  DatabaseService,
  LookupRepository,
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
import { BusinessSource, ChallengeCreatorType, ChallengeParticipationEnum, ChallengeVisibility, PlatformUserRole, UserScope } from '@shared/enums';
import { BadRequestException, NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate, genTimestamp, noop, renderTemplateString, sanitizeInput } from '@shared/utils';
import { join } from 'path';
import { ICurrentUser } from 'src/core/types';

interface UpdateChallengeInput {
  data: {
    challengeId: string;
    title?: string;
    sdgIds?: number[];
    companyName?: string | null;
    sectorId?: number | null;
    description?: string | null;
    visibility: ChallengeVisibility;
    expectation?: string | null;
    logoUrl?: string | null;
    targetGrades?: number[] | null;
    targetStudents?: string[] | null;
  };
  user: ICurrentUser;
}

export class UpdateChallengeUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      ws: WSGateway;
      emailService: EmailService;
      lookupRepo: LookupRepository;
      challengeRepo: ChallengeRepository;
      businessRepo: BusinessRepository;
      studentRepo: StudentRepository;
    },
  ) {}

  async execute(input: UpdateChallengeInput) {
    const { logger, dbService, ws, emailService, challengeRepo, lookupRepo, businessRepo, studentRepo } = this.dependencies;
    const { data, user } = input;

    const replaceVisibilityMappings = async () => {
      await challengeRepo.clearVisibilityMappings({ challengeId: data.challengeId });

      const studentIds: string[] = [];

      if (data.targetGrades?.length) {
        for (const gradeId of data.targetGrades) {
          const studentsList = await studentRepo.getStudentIds({
            schoolId: user.schoolId,
            gradeId,
            enrollmentStatus: 'active',
          });

          studentIds.push(...studentsList);
        }
      }

      if (data.targetStudents?.length) {
        const studentsIds = await studentRepo.getStudentIds({
          schoolId: user.schoolId,
          studentIds: data.targetStudents,
        });

        studentIds.push(...studentsIds);
      }

      const uniqueStudentIds = [...new Set(studentIds)];

      if (uniqueStudentIds.length) {
        const studentsIdsInChallenge = await challengeRepo.getStudentsIdsInChallenge({
          challengeId: data.challengeId,
        });

        if (studentsIdsInChallenge?.length) {
          const missingStudents = studentsIdsInChallenge.filter((id) => !uniqueStudentIds.includes(id));

          if (missingStudents.length > 0) {
            throw new BadRequestException('You have assigned students in this challenge. Please unassign them before changing the visibility.');
          }
        }

        await challengeRepo.addVisibility(
          uniqueStudentIds.map((studentId) => ({
            challengeId: data.challengeId,
            studentId,
          })),
        );
      }
    };

    const challenge = await challengeRepo.getChallengeById({
      challengeId: data.challengeId,
    });

    const payload: Record<string, unknown> = {
      challengeId: data.challengeId,
      title: sanitizeInput(data.title),
      description: sanitizeInput(data.description),
      visibility: sanitizeInput(data.visibility),
      expectation: sanitizeInput(data.expectation),
      companyName: sanitizeInput(data.companyName),
      sectorId: data.sectorId,
      logoUrl: sanitizeInput(data.logoUrl),
      sdgIds: data.sdgIds,
      updatedAt: genTimestamp().iso,
    };

    if (user.scope === UserScope.TEACHER) {
      payload['createdBy'] = user.userAccountId;
    }
    if (user.scope === UserScope.SCHOOL_ADMIN || user.scope === UserScope.TEACHER) {
      Object.assign(payload, {
        academicYearId: user.currentSchoolAYId,
      });
    }

    const newChallenge = await challengeRepo.updateChallenge(payload);

    if (!challenge) return null;

    if (data.sdgIds?.length) {
      await challengeRepo.removeChallengeSdgs({ challengeId: data.challengeId });
      await challengeRepo.associateChallengeSdgs(data.sdgIds.map((sdgId) => ({ challengeId: data.challengeId, sdgId })));

      lookupRepo
        .getSdgTitlesByIds({ sdgIds: data.sdgIds })
        .then((titles) =>
          businessRepo.updateBusiness({
            challengeId: data.challengeId,
            source: BusinessSource.CHALLENGE,
            sdgsText: titles.join(', '),
            updatedAt: genTimestamp().iso,
          }),
        )
        .catch(noop);
    }
    if (data.visibility && data.visibility !== challenge.visibility) {
      if (challenge.visibility === ChallengeVisibility.PRIVATE && data.visibility === ChallengeVisibility.PUBLIC) {
        await challengeRepo.clearVisibilityMappings({ challengeId: data.challengeId });
      }

      if (challenge.visibility === ChallengeVisibility.PUBLIC && data.visibility === ChallengeVisibility.PRIVATE) {
        await replaceVisibilityMappings();
      }
    } else if (data.visibility === ChallengeVisibility.PRIVATE) {
      if (data.targetGrades?.length || data.targetStudents?.length) {
        await replaceVisibilityMappings();
      }
    }

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        newChallenge,
      },
    })
      .then(() => logger.log(`System notification sent successfully for challenge: ${challenge.title}`))
      .catch((error) => logger.error(`Failed to send system notification for challenge ${challenge.title}. Error:`, error));

    sendEmailNotification({ dbService, emailService, user, data: { newChallenge } }).then(EmailService.handleEmailSuccess).catch(EmailService.handleEmailError);

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
      challengeRepo: new ChallengeRepository(db),
      schoolRepo: new SchoolRepository(db),
    }),
    callback: async ({ platformUserRepo, notificationRepo, schoolAdminRepo, teacherRepo, challengeRepo, schoolRepo }) => {
      const { newChallenge } = data;
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
        schoolId: user?.schoolId,
      };

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        challengeName: newChallenge.title,
      };

      const studentsTemplatePayload: Record<string, any> = {
        userAccountName: ' ',
        challengeName: newChallenge.title,
      };
      const schoolAdminTemplatePayload: Record<string, any> = {
        userAccountName: ' ',
        challengeName: newChallenge.title,
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

      const isPlatformCreator = newChallenge.creatorType === ChallengeCreatorType.PLATFORM_USER;

      const commonPayload = {
        ...operationPayload,
        ...(isPlatformCreator ? {} : { schoolId: newChallenge.schoolId }),
      };

      const [platformUsers, schoolAdmins, teachers, students, school] = await Promise.all([
        platformUserRepo.getPlatformUsers(operationPayload),
        schoolAdminRepo.getSchoolAdmins(commonPayload),
        teacherRepo.getTeachers(commonPayload),
        challengeRepo.getVisibleStudents({ challengeId: newChallenge.id }),
        schoolRepo.getSchool(operationPayload),
      ]);

      if (newChallenge.visibility === ChallengeVisibility.PUBLIC) {
        const participants = await challengeRepo.getChallengeParticipants({
          challengeId: newChallenge.id,
          participation: ChallengeParticipationEnum.PARTICIPATED,
        });
        if (participants?.length) {
          students.push(...participants);
        }
      }

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.UPDATED_CHALLENGE,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, templatePayload),
        data: JSON.stringify({ challengeName: newChallenge.title }),
        createdBy: user.userAccountId,
      };

      const studentsNotificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, studentsTemplatePayload),
        data: JSON.stringify({ challengeName: newChallenge.title }),
        createdBy: user.userAccountId,
      };

      const schoolAdminNotificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, schoolAdminTemplatePayload),
        data: JSON.stringify({ challengeName: newChallenge.title }),
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

      students.forEach((student) => {
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
      platformUserRepo: new PlatformUserRepository(db),
      schoolAdminRepo: new SchoolAdminRepository(db),
      teacherRepo: new TeacherRepository(db),
      challengeRepo: new ChallengeRepository(db),
    }),

    callback: async ({ platformUserRepo, schoolAdminRepo, teacherRepo, challengeRepo }) => {
      const { newChallenge } = data;
      const year = new Date().getFullYear();

      const isPlatformCreator = newChallenge.creatorType === ChallengeCreatorType.PLATFORM_USER;

      const operationPayload = {
        excludeUserAccountIds: [user.userAccountId],
        ...(isPlatformCreator ? {} : { schoolId: newChallenge.schoolId }),
      };

      const [schoolAdmins, teachers, students] = await Promise.all([
        schoolAdminRepo.getSchoolAdmins(operationPayload),
        teacherRepo.getTeachers(operationPayload),
        challengeRepo.getVisibleStudents({ challengeId: newChallenge.id }),
      ]);

      if (newChallenge.visibility === ChallengeVisibility.PUBLIC) {
        const participants = await challengeRepo.getChallengeParticipants({
          challengeId: newChallenge.id,
          participation: ChallengeParticipationEnum.PARTICIPATED,
        });
        if (participants?.length) {
          students.push(...participants);
        }
      }

      const recipients = [...teachers, ...schoolAdmins];
      const scopeName = user.scope === UserScope.PLATFORM_USER ? 'Trusity' : user.scope === UserScope.SCHOOL_ADMIN ? 'School Admin' : 'Teacher';

      const sendEmails = async ({
        list,
        template,
        subject,
        contextBuilder,
      }: {
        list: Record<string, any>[];
        template: string;
        subject: string;
        contextBuilder: (recipient: Record<string, any>) => Record<string, any>;
      }) => {
        if (!list?.length) return;

        await Promise.all(
          list.map(async (recipient) => {
            const html = await compileHbsTemplate({
              templatePath: join(process.cwd(), template),
              context: contextBuilder(recipient),
            });

            return await emailService.sendEmail({
              to: recipient.email,
              subject,
              html,
            });
          }),
        );
      };

      // PLATFORM USER (Trusity) → notify school admins & teachers
      if (user.scope === UserScope.PLATFORM_USER) {
        await sendEmails({
          list: recipients,
          template: 'src/presentation/views/challenge-update-trusity-notification.hbs',
          subject: 'Challenge Updated by Trusity',
          contextBuilder: (recipient) => ({
            RecipientName: recipient.name,
            ChallengeName: newChallenge.title,
            year,
          }),
        });
      }

      // SCHOOL ADMIN / TEACHER → notify other school admins & teachers
      if (user.scope === UserScope.SCHOOL_ADMIN || user.scope === UserScope.TEACHER) {
        await sendEmails({
          list: recipients,
          template: 'src/presentation/views/challenge-update-school-admin-notification.hbs',
          subject: `Challenge Updated by ${scopeName}`,
          contextBuilder: (recipient) => ({
            RecipientName: recipient.name,
            ChallengeName: newChallenge.title,
            UpdatedByRole: scopeName,
            UpdatedByName: user.name,
            year,
          }),
        });
      }

      // STUDENTS → always notify all students
      await sendEmails({
        list: students,
        template: 'src/presentation/views/challenge-update-student-notification.hbs',
        subject: 'Challenge Updated – Check It Out!',
        contextBuilder: (student) => ({
          RecipientName: student.name,
          ChallengeName: newChallenge.title,
          UpdatedBy: scopeName,
          year,
        }),
      });
    },
  });
}
