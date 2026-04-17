import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { getConfigService } from '@infrastructure/config';
import {
  DatabaseService,
  LookupRepository,
  PlatformUserRepository,
  SchoolAdminRepository,
  SchoolRepository,
  StudentRepository,
  UserAccountRepository,
} from '@infrastructure/database';
import { EmailService } from '@infrastructure/email';
import { BulkUploadStudentsSchema } from '@presentation/graphql/modules/student/schemas';
import { BusinessModelEnum, PlatformUserRole, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { BadRequestException, ForbiddenException, NotFoundException, ValidationException } from '@shared/execeptions';
import { formatZodErrors, generateRandomPassword, genTimestamp, hashPassword, renderTemplateString, sanitizeInput } from '@shared/utils';
import * as XLSX from 'xlsx';
import { sendStudentWelcomeEmail } from './create-student.use-case';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { NotificationType } from '@shared/constants';

interface BulkUploadStundetsUseCaseInput {
  data: {
    schoolId?: string | null;
    fileKey: string;
  };
  user: ICurrentUser;
}

export class BulkUploadStundetsUseCase {
  constructor(
    private dependencies: {
      emailService: EmailService;
      lookupRepo: LookupRepository;
      userAccountRepo: UserAccountRepository;
      schoolRepo: SchoolRepository;
      dbService: DatabaseService;
      ws: WSGateway;
      s3Service: S3Service;
      studentRepo: StudentRepository;
    },
  ) {}

  async execute({ data, user }: BulkUploadStundetsUseCaseInput) {
    const { emailService, lookupRepo, s3Service, schoolRepo, userAccountRepo, studentRepo, dbService, ws } = this.dependencies;

    const configService = await getConfigService();

    const actionAt = genTimestamp().iso;

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

    const file = await s3Service.getFile(data.fileKey);

    const results: any[] = [];

    const emailPayloads: any[] = [];

    if (file) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
        range: 1,
        raw: true,
        header: ['Name', 'Email', 'ContactNumber', 'DateOfBirth', 'GuardianName', 'GuardianContactNumber', 'GuardianEmail', 'Grade', 'Section'],
      });

      const grades = await lookupRepo.findAllGrades();
      const sections = await lookupRepo.findAllSections();
      const gradeMap = new Map(grades.map((g) => [g.name.toString(), g.id]));
      const sectionMap = new Map(sections.map((s) => [s.name.toString(), s.id]));

      const enrollmentStatus = await lookupRepo.getEnrollmentStatus({
        enrollmentStatusCode: EnrollmentStatusEnum.ACTIVE,
      });

      if (!enrollmentStatus) {
        throw new BadRequestException('Active enrollment status not found. Please ensure the required status is configured in the system.');
      }

      if (!school.currentAYId) {
        throw new BadRequestException('Academic year not configured. Please set the academic start and end months for this school.');
      }

      if (school.accountType === BusinessModelEnum.B2B) {
        const totalEnrolledStudents = await studentRepo.countStudents({
          academicYearId: school.currentAYId,
          schoolId: school.id,
        });

        if (totalEnrolledStudents + rows.length > school.totalLicense) {
          throw new BadRequestException('License limit reached, please purchase additional licenses.');
        }

        const validation = BulkUploadStudentsSchema.safeParse(rows);
        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        for (const row of rows) {
          const password = generateRandomPassword();
          const { salt, hash } = hashPassword(password);

          const userAccount = await userAccountRepo.createUserAccount({
            email: sanitizeInput(row.Email),
            scope: UserScope.STUDENT,
          });

          await userAccountRepo.createUserAuth({
            userAccountId: userAccount.id,
            passwordSalt: salt,
            passwordHash: hash,
          });

          const createStudentPayload = {
            schoolId: payload.schoolId,
            userAccountId: userAccount.id,
            name: sanitizeInput(row.Name),
            accountType: BusinessModelEnum.B2B,
            email: sanitizeInput(row.Email),
            currentAYId: school.currentAYId,
            gradeId: gradeMap.get(row.Grade.toString()) || null,
            sectionId: sectionMap.get(row.Section.toString()) || null,
            contactNumber: sanitizeInput(row.ContactNumber),
            dateOfBirth: sanitizeInput(row.DateOfBirth),
            guardianName: sanitizeInput(row.GuardianName),
            guardianEmail: sanitizeInput(row.GuardianEmail),
            guardianContactNumber: sanitizeInput(row.GuardianContactNumber),
          };

          const newStudent = await studentRepo.createStudent(createStudentPayload);

          await studentRepo.createEnrollment({
            studentId: newStudent.id,
            academicYearId: school.currentAYId,
            schoolId: newStudent.schoolId,
            gradeId: newStudent.gradeId,
            sectionId: newStudent.sectionId,
            enrollmentDate: actionAt,
            enrollmentStatusId: enrollmentStatus.id,
          });

          emailPayloads.push({
            name: newStudent.name,
            email: newStudent.email,
            loginUrl: `${configService.get<string>('app.homeUrl')!}/login`,
            password,
          });

          results.push(newStudent);
        }
      }
    }

    emailPayloads.forEach((emailPayload) => {
      sendStudentWelcomeEmail(emailService, {
        name: emailPayload.name,
        email: emailPayload.email,
        loginUrl: emailPayload.loginUrl,
        password: emailPayload.password,
      })
        .then(EmailService.handleEmailSuccess)
        .catch(EmailService.handleEmailError);
    });

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        schoolName: school.name,
        schoolId: payload.schoolId,
      },
    })
      .then(() => console.log(`System notification sent successfully for bulk uplaoded students`))
      .catch((error) => console.error(`Failed to send system notification for bulk uplaoded students`, error));

    return results;
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

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
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

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.UPLOADED_BULK_STUDENTS,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const basePayload = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        data: JSON.stringify({}),
        createdBy: user.userAccountId,
      };

      const platformUsersNotificationPayload = {
        ...basePayload,
        message: renderTemplateString(notificationType.template, templatePayload),
      };

      const schoolAdminsNotificationPayload = {
        ...basePayload,
        message: 'Trusity bulk uploaded students under your school',
      };

      const [platformNotification, schoolAdminNotification] = await Promise.all(
        [platformUsersNotificationPayload, schoolAdminsNotificationPayload].map((p) => notificationRepo.createNotification(p)),
      );

      const notificationRecipients: Record<string, any>[] = [];

      platformUsers.forEach((platformUser) => {
        if (platformUser.role === PlatformUserRole.SUPERADMIN) {
          notificationRecipients.push({
            notificationId: platformNotification.id,
            userAccountId: platformUser.userAccountId,
          });
        } else if (user.scope === UserScope.SCHOOL_ADMIN) {
          notificationRecipients.push({
            notificationId: platformNotification.id,
            userAccountId: platformUser.userAccountId,
          });
        }
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
