import { ICurrentUser } from '@core/types';
import { getConfigService } from '@infrastructure/config';
import { DatabaseService, PlatformUserRepository, SchoolAdminRepository, SchoolRepository, TeacherRepository, UserAccountRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { NotificationType } from '@shared/constants';
import { PlatformUserRole, UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { generateRandomPassword, hashPassword, renderTemplateString, sanitizeInput } from '@shared/utils';

interface CreateTeacherUseCaseInput {
  data: {
    schoolId?: string | null;
    name: string;
    email: string;
    contactNumber?: string | null;
    assignedClasses: {
      gradeId: number;
      sectionIds: number[];
    }[];
    avatarUrl?: string | null;
  };
  user: ICurrentUser;
}

export class CreateTeacherUseCase {
  constructor(
    private readonly dependencies: {
      userAccountRepo: UserAccountRepository;
      teacherRepo: TeacherRepository;
      schoolRepo: SchoolRepository;
      platformUserRepo: PlatformUserRepository;
      notificationRepo: NotificationRepository;
      dbService: DatabaseService;
      emailService: EmailService;
      ws: WSGateway;
      schoolAdminRepo: SchoolAdminRepository;
    },
  ) {}

  async execute(input: CreateTeacherUseCaseInput) {
    const { userAccountRepo, teacherRepo, emailService, dbService, ws } = this.dependencies;
    const { data, user } = input;
    const configService = await getConfigService();

    const password = generateRandomPassword();
    const { salt, hash } = hashPassword(password);

    const userAccount = await userAccountRepo.createUserAccount({
      email: sanitizeInput(data.email),
      scope: UserScope.TEACHER,
    });

    await userAccountRepo.createUserAuth({
      userAccountId: userAccount.id,
      passwordSalt: salt,
      passwordHash: hash,
    });

    const createTeacherPayload = {
      userAccountId: userAccount.id,
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email),
      contactNumber: sanitizeInput(data.contactNumber),
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        Object.assign(createTeacherPayload, {
          schoolId: data.schoolId,
        });
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(createTeacherPayload, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const newTeacher = await teacherRepo.createTeacher(createTeacherPayload);

    const assignments: {
      teacherId: number;
      schoolId: number;
      gradeId: number;
      sectionId: number;
    }[] = [];

    for (const assignedClass of data.assignedClasses) {
      for (const sectionId of assignedClass.sectionIds) {
        assignments.push({
          teacherId: newTeacher.id,
          schoolId: newTeacher.schoolId,
          gradeId: assignedClass.gradeId,
          sectionId,
        });
      }
    }
    sendTeacherWelcomeEmail(emailService, {
      name: newTeacher.name,
      email: newTeacher.email,
      loginUrl: `${configService.get<string>('app.homeUrl')!}/login`,
      password,
    })
      .then(EmailService.handleEmailSuccess)
      .catch(EmailService.handleEmailError);

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        teacherName: newTeacher.name,
        schoolId: user.scope === UserScope.PLATFORM_USER ? data.schoolId : user.schoolId,
      },
    })
      .then(() => console.log(`System notification sent successfully for schooladmin: ${newTeacher.name}`))
      .catch((error) => console.error(`Failed to send system notification for schooladmin ${newTeacher.name}. Error:`, error));

    await teacherRepo.associateTeacherClassAssignments(assignments);

    return newTeacher;
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
        notificationType: NotificationType.CREATED_TEACHER,
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
        message: `Trusity created a new Teacher ${data.teacherName} under your school`,
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

async function sendTeacherWelcomeEmail(emailService: EmailService, context: Record<string, any>) {
  const html = `
<p>Dear ${context.name},</p>
<p>
  Welcome to
  <strong>TruPreneurs.AI</strong>
  ! Your account has been successfully created. You can log in using the following credentials:
</p>
<ul>
  <li>
    <strong>Username (Email):</strong>
    ${context.email}
  </li>
  <li>
    <strong>Password:</strong>
  ${context.password}
  </li>
</ul>
<p>For your security, please log in and change your password as soon as possible.</p>
<p>
  <a href="${context.loginUrl}" target="_blank">Login</a>
</p>
<p>If the button above does not work, copy and paste this link into your browser:</p>
<p><a href="${context.loginUrl}" target="_blank">${context.loginUrl}</a></p>
<p>We’re excited to have you onboard. Let us know if you need any help getting started.</p>
<p>
  Best regards,
  <br />
TruPreneurs.AI
</p>
  `;

  await emailService.sendEmail({
    to: context.email,
    subject: 'Your Account Credentials for TruPreneurs.AI',
    html,
  });
}
