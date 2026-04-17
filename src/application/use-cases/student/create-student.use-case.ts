import { ICurrentUser } from '@core/types';
import { getConfigService } from '@infrastructure/config/config.module';
import {
  DatabaseService,
  LookupRepository,
  PlatformUserRepository,
  SchoolAdminRepository,
  SchoolRepository,
  StudentRepository,
  UserAccountRepository,
} from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@shared/constants';
import { BusinessModelEnum, PlatformUserRole, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { generateRandomPassword, genTimestamp, hashPassword, renderTemplateString, sanitizeInput } from '@shared/utils';

interface CreateStudentUseCaseInput {
  data: {
    accountType: BusinessModelEnum;
    schoolId?: string | null;
    name: string;
    email: string;
    contactNumber?: string | null;
    dateOfBirth?: string | null;
    guardian?: {
      name?: string | null;
      email?: string | null;
      contactNumber?: string | null;
    };
    gradeId: number;
    sectionId: number;
    avatarUrl?: string | null;
  };
  user: ICurrentUser;
}

export class CreateStudentUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      emailService: EmailService;
      studentRepo: StudentRepository;
      userAccountRepo: UserAccountRepository;
      schoolRepo: SchoolRepository;
      lookupRepo: LookupRepository;
      ws: WSGateway;
    },
  ) {}

  async execute(input: CreateStudentUseCaseInput) {
    try {
      const { logger, dbService, userAccountRepo, studentRepo, emailService, schoolRepo, lookupRepo, ws } = this.dependencies;
      const { data, user } = input;

      const actionAt = genTimestamp().iso;

      const configService = await getConfigService();

      const password = generateRandomPassword();
      const { salt, hash } = hashPassword(password);

      const payload = {
        schoolId: data.schoolId,
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

      const school = await schoolRepo.getSchool({
        schoolId: payload.schoolId,
      });

      if (!school) {
        throw new NotFoundException('School not found. Please check the provided school ID.');
      }

      if (!school.currentAYId) {
        throw new BadRequestException('Academic year not configured. Please set the academic start and end months for this school.');
      }

      if (school.accountType === BusinessModelEnum.B2B) {
        const totalEnrolledStudents = await studentRepo.countStudents({
          academicYearId: school.currentAYId,
          schoolId: school.id,
        });

        if (totalEnrolledStudents >= school.totalLicense) {
          throw new BadRequestException('License limit reached, please purchase additional licenses.');
        }
      }

      if (school.accountType === BusinessModelEnum.B2C) {
        await Promise.all([
          schoolRepo.upsertSchoolGrade({
            schoolId: school.id,
            gradeId: data.gradeId,
          }),
          schoolRepo.upsertSchoolSections([
            {
              schoolId: school.id,
              gradeId: data.gradeId,
              sectionId: data.sectionId,
            },
          ]),
        ]);
      }

      const userAccount = await userAccountRepo.createUserAccount({
        email: sanitizeInput(data.email),
        scope: UserScope.STUDENT,
      });

      await userAccountRepo.createUserAuth({
        userAccountId: userAccount.id,
        passwordSalt: salt,
        passwordHash: hash,
      });

      const createStudentPayload: Record<string, any> = {
        schoolId: payload.schoolId,
        userAccountId: userAccount.id,
        name: sanitizeInput(data.name),
        accountType: school.accountType,
        email: sanitizeInput(data.email),
        currentAYId: school.currentAYId,
        gradeId: data.gradeId,
        sectionId: data.sectionId,
        contactNumber: sanitizeInput(data.contactNumber),
        dateOfBirth: sanitizeInput(data.dateOfBirth),
        guardianName: sanitizeInput(data.guardian?.name),
        guardianEmail: sanitizeInput(data.guardian?.email),
        guardianContactNumber: sanitizeInput(data.guardian?.contactNumber),
      };

      const newStudent = await studentRepo.createStudent(createStudentPayload);

      const enrollmentStatus = await lookupRepo.getEnrollmentStatus({
        enrollmentStatusCode: EnrollmentStatusEnum.ACTIVE,
      });

      if (!enrollmentStatus) {
        throw new BadRequestException('Active enrollment status not found. Please ensure the required status is configured in the system.');
      }

      await studentRepo.createEnrollment({
        studentId: newStudent.id,
        academicYearId: school.currentAYId,
        schoolId: newStudent.schoolId,
        gradeId: data.gradeId,
        sectionId: data.sectionId,
        enrollmentDate: actionAt,
        enrollmentStatusId: enrollmentStatus.id,
      });

      sendStudentWelcomeEmail(emailService, {
        name: newStudent.name,
        email: newStudent.email,
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
          studentName: newStudent.name,
          schoolName: school.name,
          schoolId: school.id,
        },
      })
        .then(() => logger.log(`System notification sent successfully for challenge: ${newStudent.name}`))
        .catch((error) => logger.error(`Failed to send system notification for challenge ${newStudent.name}. Error:`, error));

      return newStudent;
    } catch (error: any) {
      if (error.code === '23505') {
        if (error.constraint === 'user_account_email_unique') {
          throw new BadRequestException('The email address you entered is already in use. Please use a different email.');
        }
      }

      throw error;
    }
  }
}

export async function sendStudentWelcomeEmail(emailService: EmailService, context: Record<string, any>) {
  const html = `
<p>Dear ${context.name},</p>
<p>Get ready to create, compete, and conquer! 🎯</p>
<p>Here’s your access to start your journey:</p>
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
<p>Jump in, explore the challenges, and start building your entrepreneurial skills</p>
<p>We’re excited to have you onboard. Let us know if you need any help getting started.</p>
<p>
  Best regards,
  <br />
  TruPreneurs.AI
</p>
    `;

  return await emailService.sendEmail({
    to: context.email,
    subject: 'Welcome to Trupreneurs.AI– Your Student Journey Begins!',
    html,
  });
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentUser; data: Record<string, any> }) {
  const { dbService, user, data, ws } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      platformUserRepo: new PlatformUserRepository(db),
      schoolAdminRepo: new SchoolAdminRepository(db),
    }),
    callback: async ({ platformUserRepo, notificationRepo, schoolAdminRepo }) => {
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
        schoolId: data.schoolId,
      };

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        studentName: data.studentName,
        schoolName: data.schoolName,
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

      const [platformUsers, schoolAdmins] = await Promise.all([platformUserRepo.getPlatformUsers(operationPayload), schoolAdminRepo.getSchoolAdmins(operationPayload)]);

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.CREATED_STUDENT,
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
        message: `Trusity created a new student ${data.studentName} under your school`,
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
        const liveRecipients = notificationRecipients.map((recipient) => ({
          id: String(recipient.userAccountId),
          reFetchNotification: true,
        }));
        ws.sendMessage(liveRecipients);
      }
    },
  });
}
