import { ICurrentUser } from '@core/types';
import { getConfigService } from '@infrastructure/config';
import { AiPerformanceFeedbackRepository, BusinessRepository, StudentRepository } from '@infrastructure/database';
import { EmailService } from '@infrastructure/email';
import { BusinessStatus, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate, isDefinedStrict, normalizeNumber } from '@shared/utils';
import { renderHtmlToPdf } from '@shared/utils/html-to-pdf.util';
import * as path from 'path';

interface SendStudentPerfomanceReportInput {
  data: {
    studentId: string;
    businessId: string;
    feedbackId: string;
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class SendStudentPerfomanceReportToGuardianUseCase {
  constructor(
    private readonly dependencies: {
      studentRepo: StudentRepository;
      businessRepo: BusinessRepository;
      emailService: EmailService;
      aiPerformanceFeedbackRepo: AiPerformanceFeedbackRepository;
    },
  ) {}

  async execute(input: SendStudentPerfomanceReportInput) {
    const { businessRepo, studentRepo, emailService, aiPerformanceFeedbackRepo } = this.dependencies;
    const { user } = input;
    const configService = await getConfigService();

    const payload: Record<string, any> = {
      studentId: input.data.studentId,
      businessId: input.data.businessId,
      feedbackId: input.data.feedbackId,
      status: input.data.status,
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
      case UserScope.STUDENT: {
        Object.assign(payload, {
          studentId: user.id,
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const businessReport = await businessRepo.getBusinessReport(payload);

    Object.assign(payload, {
      academicYearId: businessReport?.academicYearId,
    });

    const [student, feedback, overallReport, topBusinessReport, businessProgressScore] = await Promise.all([
      studentRepo.getStudentOverview(payload),
      aiPerformanceFeedbackRepo.getFeedbackById(payload),
      businessRepo.getOverallBusinessReport(payload),
      businessRepo.getTopPerformedBusinesses(payload),
      businessRepo.getBusinessProgressScore(payload),
    ]);

    if (!businessReport || !student) {
      throw new NotFoundException('The information required for this report is unavailable.');
    }

    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    if (!overallReport.high_i) {
      return null;
    }

    const averageIScore =
      (normalizeNumber(businessProgressScore?.problemStatement) +
        normalizeNumber(businessProgressScore?.marketResearch) +
        normalizeNumber(businessProgressScore?.marketFit) +
        normalizeNumber(businessProgressScore?.prototype)) /
      4;

    const averageEScore =
      (normalizeNumber(businessProgressScore?.businessModel) + normalizeNumber(businessProgressScore?.financialProjections) + normalizeNumber(businessProgressScore?.marketing)) /
      3;

    const averageCScore = normalizeNumber(businessProgressScore?.pitchFeedback);

    const html = await compileHbsTemplate({
      templatePath: path.join(process.cwd(), 'src/presentation/views/report-templates/student-performance-report-view.hbs'),
      context: {
        businessName: businessReport.businessName,
        topPerformedBusinessName: topBusinessReport[0].businessName,
        studentName: student.name,
        studentGrade: student.gradeName,
        studentSection: student.sectionName,
        schoolName: student.schoolName,
        topScore: topBusinessReport[0].averageScores.averageScore,
        assetBaseUrl: configService.get<string>('app.assetBaseUrl'),

        ...overallReport,
        impact_i: overallReport.high_i - overallReport.low_i,
        impact_e: overallReport.high_e - overallReport.low_e,
        impact_c: overallReport.high_c - overallReport.low_c,

        innovation: {
          averageIScore: businessReport.innovation.averageIScore,
          scores: businessReport.innovation.scores,
          statuses: businessReport.innovation.statuses,
        },
        entrepreneurship: {
          averageEScore: businessReport.entrepreneurship.averageEScore,
          scores: businessReport.entrepreneurship.scores,
          statuses: businessReport.entrepreneurship.statuses,
        },
        communication: {
          averageCScore: businessReport.communication.averageCScore,
          scores: businessReport.communication.scores,
          statuses: businessReport.communication.statuses,
        },
        investment: {
          pitchStatement: businessReport.investment?.fundPitchStatement?.pitchStatement || '',
        },
        launch: {
          recommendation: businessReport.launchRecommendation || '',
        },
        feedback: feedback ? JSON.parse(feedback.feedback) : null,
        averageOverallScore: (averageIScore + averageEScore + averageCScore) / 3,
      },
    });

    const businessModelPDF = await renderHtmlToPdf({
      html,
      format: 'A4',
      landscape: false,
      displayHeaderFooter: true,
      printBackground: true,
      headerTemplate: `
            <div style="
              width:100%;
              padding: 0 30px;
              box-sizing:border-box;
            ">
              <p style="
                text-align:right;
                font-size:12px;
                margin:0;
              ">
                Date: ${formattedDate}
              </p>
            </div>
          `,

      footerTemplate: `
    <div style="
      width: 100%;
      padding: 0 20px;
      box-sizing: border-box;
    ">
      <div style="
        display: flex;
        align-items: center;
        width: 100%;
        gap: 10px;
      ">
        <p style="
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          font-size: 12px;
          color: #000000;
          flex-shrink: 0;
          letter-spacing: 0;
          margin: 0;
        ">
          Student Performance Report
        </p>
  
        <div style="
          margin-top: 2px;
          flex-grow: 1;
          height: 0;
          border-bottom: 2px solid;
          border-image: linear-gradient(to right, #F79333, #93246A) 1;
        "></div>
      </div>
    </div>
  `,
    });
    const buffer = Buffer.from(businessModelPDF);

    const emailBody = await compileHbsTemplate({
      templatePath: path.join(process.cwd(), 'src/presentation/views/report-templates/student-business-report-to-guardian.hbs'),
      context: {
        studentName: student.name,
        businessName: businessReport.businessName,
        senderName: input.user.name,
        schoolName: student.schoolName,
      },
    });

    if (student.guardian.email) {
      return emailService
        .sendEmail({
          to: student.guardian.email,
          subject: 'Student Business Performance Report',
          html: emailBody,
          attachments: [
            {
              filename: `${student.name}_${businessReport.businessName}_Report.pdf`,
              content: buffer,
              contentType: 'application/pdf',
            },
          ],
        })
        .then(EmailService.handleEmailSuccess)
        .catch(EmailService.handleEmailError);
    }
  }
}
