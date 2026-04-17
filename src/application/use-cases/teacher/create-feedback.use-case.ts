import { ICurrentUser } from '@core/types';
import { BusinessRepository, DatabaseService, SchoolAdminRepository, StudentRepository, TeacherRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { NotFoundException } from '@shared/execeptions';
import { renderTemplateString } from '@shared/utils';

interface Input {
  data: {
    businessStep: string;
    businessId: string;
    feedback: string;
    fileUrl?: string[];
  };
  user: ICurrentUser;
}

export class CreateFeedbackUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      emailService: EmailService;
      teacherRepo: TeacherRepository;
      businessRepo: BusinessRepository;
      ws: WSGateway;
    },
  ) {}

  async execute(input: Input) {
    const { data, user } = input;
    const { logger, dbService, emailService, teacherRepo, businessRepo, ws } = this.dependencies;

    // if (user.scope !== UserScope.TEACHER) {
    //   throw new Error('Only teachers can create feedback');
    // }
    const business = await businessRepo.getBusiness({ businessId: data.businessId });
    if (!business) {
      throw new NotFoundException(`Business does not exist`);
    }
    const feedbackData = await teacherRepo.createFeedback({
      businessStep: data.businessStep,
      businessId: data.businessId,
      teacherId: user.id,
      feedback: data.feedback,
      fileUrl: data.fileUrl || [],
    });
    sendFeedbackRecieveEmail(emailService, dbService, business.studentId, business.businessName, data.businessStep)
      .then(EmailService.handleEmailSuccess)
      .catch(EmailService.handleEmailError);
    sendSystemNotification({
      dbService,
      user,
      data: {
        businessName: business.businessName,
        studentId: business.studentId,
        subPhaseName:data.businessStep
      },
      ws,
    })
      .then(() => logger.log(`System notification sent successfully for feedabck for business: ${business.businessName}`))
      .catch((error) => logger.error(`Failed to send system notification for feedback for business ${business.businessName}. Error:`, error));

    return feedbackData;
  }
}

export async function sendFeedbackRecieveEmail(emailService: EmailService, dbService: DatabaseService, studentId: string | number, businessName: string, businessStep: string) {
  await dbService.runUnitOfWork({
    useTransaction: true,

    buildDependencies: async ({ db }) => ({
      studentRepo: new StudentRepository(db),
    }),

    callback: async ({ studentRepo }) => {
      const student = await studentRepo.getStudent({
        studentId: studentId,
      });

      if (!student) {
        console.log(`No student found for studentId: ${student}`);
        return;
      }

      const emailHtml = `
        <p>Hi ${student.name},</p>

<p>Your teacher has shared feedback on your business “${businessName}”  under the sub-phase ${businessStep}.</p>

<p>Take a look at the suggestions and insights provided — this is a great opportunity to improve your ideas and make your challenge even better! 💡</p?

<p>If you have any questions or concerns, please reach out to School Admin .</p>

<p>Best Regards,</p>
<p>Trupreneurs.AI</p>
      `;
      return emailService
        .sendEmail({
          to: student.email,
          subject: 'Feedback Received on Your Challenge',
          html: emailHtml,
        })
        .then(EmailService.handleEmailSuccess)
        .catch(EmailService.handleEmailError);
    },
  });
}

async function sendSystemNotification(input: { dbService: DatabaseService; user: ICurrentUser; data: Record<string, any>; ws: WSGateway }) {
  const { dbService, user, data, ws } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      schoolAdminRepo: new SchoolAdminRepository(db),
      studentRepo: new StudentRepository(db),
    }),
    callback: async ({ notificationRepo, schoolAdminRepo, studentRepo }) => {
      const student = await studentRepo.getStudent({
        studentId: data.studentId,
      });

      if (!student) {
        throw new NotFoundException('student not found for the provided ID');
      }

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        businessName: data.businessName,
        studentName: student.name,
        subPhaseName:data.subPhaseName
      };

      const schoolAdmins = await schoolAdminRepo.getSchoolAdmins({
        schoolId: student.schoolId,
      });

      const [createdFeedbackNotificationType, receivedFeedbackNotificationType] = await Promise.all([
        notificationRepo.getNotificationType({ notificationType: NotificationType.CREATED_FEEDBACK }),
        notificationRepo.getNotificationType({ notificationType: NotificationType.RECIEVED_FEEDBACK }),
      ]);

      if (!createdFeedbackNotificationType || !receivedFeedbackNotificationType) {
        throw new NotFoundException('Verify the required notification types exist before attempting to create notifications.');
      }

      function buildNotificationPayload(type: any, templatePayload: Record<string, any>, data: any, userId: string): Record<string, any> {
        return {
          notificationTypeId: type.id,
          title: type.title,
          message: renderTemplateString(type.template, templatePayload),
          data: JSON.stringify(data),
          createdBy: userId,
        };
      }

      const createdFeedbackNotificationPayload = buildNotificationPayload(createdFeedbackNotificationType, templatePayload, data, user.userAccountId);

      const receivedFeedbackNotificationPayload = buildNotificationPayload(
        receivedFeedbackNotificationType,
        (({ studentName, ...rest }) => rest)(templatePayload),
        data,
        user.userAccountId,
      );

      const [createdFeedbackNotification, receivedFeedbackNotification] = await Promise.all([
        notificationRepo.createNotification(createdFeedbackNotificationPayload),
        notificationRepo.createNotification(receivedFeedbackNotificationPayload),
      ]);

      const notificationRecipients: Record<string, any>[] = [];

      schoolAdmins.forEach((schoolAdmin) => {
        notificationRecipients.push({
          notificationId: createdFeedbackNotification.id,
          userAccountId: schoolAdmin.userAccountId,
        });
      });

      notificationRecipients.push({ notificationId: receivedFeedbackNotification.id, userAccountId: student.userAccountId });

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
