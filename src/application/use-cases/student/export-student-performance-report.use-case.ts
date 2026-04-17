const ExcelJS = require('exceljs/dist/es5');
import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { getConfigService } from '@infrastructure/config';
import { AiPerformanceFeedbackRepository, BusinessRepository, StudentRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate, genTimestamp, isDefinedStrict, normalizeNumber } from '@shared/utils';
import { renderHtmlToPdf } from '@shared/utils/html-to-pdf.util';
import * as path from 'path';
import { formatToTwoDecimals } from '../report';

interface ExportStudentPerformanceReportInput {
  data: {
    studentId: string;
    businessId: string;
    feedbackId: string;
    status?: BusinessStatus;
    fileType: string;
  };
  user: ICurrentUser;
}

export class ExportStudentPerformanceReportUseCase {
  constructor(
    private readonly dependencies: {
      studentRepo: StudentRepository;
      businessRepo: BusinessRepository;
      s3Service: S3Service;
      aiPerformanceFeedbackRepo: AiPerformanceFeedbackRepository;
    },
  ) {}

  async execute(input: ExportStudentPerformanceReportInput) {
    const { businessRepo, studentRepo, s3Service, aiPerformanceFeedbackRepo } = this.dependencies;
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

    if (input.data.fileType === 'excel') {
      const excelBuffer = await generateStudentPerformanceReportExcel({
        reportGeneratedAt: genTimestamp().dmyDash,
        studentName: student.name,
        studentGrade: student.gradeName,
        studentSection: student.sectionName,
        schoolName: student.schoolName,
        status: input.data.status,
        businessName: businessReport.businessName,
        topPerformedBusinessName: topBusinessReport[0]?.businessName,
        topScore: topBusinessReport[0]?.averageScores?.averageScore,
        overallReport,
        averageIScore,
        averageEScore,
        averageCScore,
        businessProgressScore,
        feedback: feedback ? JSON.parse(feedback.feedback) : null,
        pitchStatement: businessReport.investment?.fundPitchStatement?.pitchStatement || 'No data',
        recommendation: businessReport.launchRecommendation || '',
      });

      const excelKey = `business-reports/${student.name}_${businessReport.businessName}_Report.xlsx`;

      await s3Service.uploadFile({
        key: excelKey,
        body: Buffer.from(excelBuffer),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        acl: 'private',
      });

      const { downloadUrl, expiresIn } = await s3Service.generateS3DownloadUrl({
        key: excelKey,
        expiresIn: 6000,
      });

      return {
        downloadUrl,
        expiresIn,
      };
    }

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
        businessStatus: input.data.status,

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
              Date: ${genTimestamp().dmyDash}
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
        font-family: 'Inter', sans-serif;
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

    const pdfKey = `business-reports/${student.name}_${businessReport.businessName}_Report.pdf`;

    await s3Service.uploadFile({
      key: pdfKey,
      body: buffer,
      contentType: 'application/pdf',
      acl: 'private',
    });

    const { downloadUrl, expiresIn } = await s3Service.generateS3DownloadUrl({
      key: pdfKey,
      expiresIn: 6000,
    });

    return {
      downloadUrl,
      expiresIn,
    };
  }
}

// Excel export for student performance report
export async function generateStudentPerformanceReportExcel(input: {
  reportGeneratedAt: string;
  studentName: string;
  studentGrade: string;
  studentSection: string;
  schoolName: string;
  status?: BusinessStatus;
  businessName: string;
  topPerformedBusinessName?: string;
  topScore?: number;
  overallReport: Record<string, any>;
  averageIScore: number;
  averageEScore: number;
  averageCScore: number;
  businessProgressScore: Record<string, any> | null;
  feedback: Record<string, any> | null;
  pitchStatement: string;
  recommendation: string;
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Student Performance Report');

  // PAGE SETUP
  sheet.pageSetup = {
    orientation: 'portrait',
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  // META INFO
  const metaRows = [
    ['Report Generated At', input.reportGeneratedAt],
    ['Student Name', input.studentName],
    ['School', input.schoolName],
    ['Grade', input.studentGrade],
    ['Class', input.studentSection],
    [],
    ['Top Score', (formatToTwoDecimals(input.topScore) ?? '') + '%'],
    ['Business Name', input.topPerformedBusinessName ?? ''],
  ];
  metaRows.forEach((row) => {
    const r = sheet.addRow(row);
    r.getCell(1).font = { bold: true };
  });
  sheet.addRow([]);

  // OVERALL REPORT TABLE
  if (input.overallReport) {
    const phaseReport = [
      {
        phase: 'Innovation',
        high: input.overallReport.high_i,
        low: input.overallReport.low_i,
        impact: input.overallReport.impact_i,
        avg: input.overallReport.avg_i,
      },
      {
        phase: 'Entrepreneurship',
        high: input.overallReport.high_e,
        low: input.overallReport.low_e,
        impact: input.overallReport.impact_e,
        avg: input.overallReport.avg_e,
      },
      {
        phase: 'Communication',
        high: input.overallReport.high_c,
        low: input.overallReport.low_c,
        impact: input.overallReport.impact_c,
        avg: input.overallReport.avg_c,
      },
    ];
    sheet.addRow(['Phase', 'Highest Score', 'Lowest Score', 'Impact', 'Avg. Score']).font = { bold: true };
    phaseReport.forEach((p) => {
      const row = sheet.addRow([
        p.phase,
        `${formatToTwoDecimals(p.high)}%`,
        `${formatToTwoDecimals(p.low)}%`,
        `${formatToTwoDecimals(p.impact)}%`,
        `${formatToTwoDecimals(p.avg)}%`,
      ]);
    });
    sheet.addRow([]);
  }

  sheet.addRow(['Status', input.status ?? 'All']);
  sheet.addRow(['Business Name', input.businessName]);

  sheet.addRow(['Innovation', formatToTwoDecimals(input.averageIScore) + '%']);
  sheet.addRow(['I1', 'Problem Statement', formatToTwoDecimals(input.businessProgressScore?.problemStatement) + '%']);
  sheet.addRow(['I2', 'Market Research', formatToTwoDecimals(input.businessProgressScore?.marketResearch) + '%']);
  sheet.addRow(['I3', 'Market Fit & Feasibility', formatToTwoDecimals(input.businessProgressScore?.marketFit) + '%']);
  sheet.addRow(['I4', 'Prototype Solution', formatToTwoDecimals(input.businessProgressScore?.prototype) + '%']);

  const feedbackIRow = sheet.addRow(['AI Feedback', input.feedback?.innovationFeedback]);
  feedbackIRow.getCell(1).font = { bold: true };
  sheet.mergeCells(`B${feedbackIRow.number}:I${feedbackIRow.number}`);
  const feedbackICell = sheet.getCell(`B${feedbackIRow.number}`);
  feedbackICell.alignment = {
    wrapText: true,
    vertical: 'top',
    horizontal: 'left',
  };
  feedbackIRow.height = 140;

  sheet.addRow(['Entrepreneurship', formatToTwoDecimals(input.averageEScore) + '%']);
  sheet.addRow(['E1', 'Business Model', formatToTwoDecimals(input.businessProgressScore?.businessModel) + '%']);
  sheet.addRow(['E2', 'Financial Planning', formatToTwoDecimals(input.businessProgressScore?.financialProjections) + '%']);
  sheet.addRow(['E3', 'Marketing and Branding', formatToTwoDecimals(input.businessProgressScore?.marketing) + '%']);

  const feedbackERow = sheet.addRow(['AI Feedback', input.feedback?.entrepreneurshipFeedback]);
  feedbackERow.getCell(1).font = { bold: true };
  sheet.mergeCells(`B${feedbackERow.number}:I${feedbackERow.number}`);
  const feedbackECell = sheet.getCell(`B${feedbackERow.number}`);
  feedbackECell.alignment = {
    wrapText: true,
    vertical: 'top',
    horizontal: 'left',
  };
  feedbackERow.height = 140;

  sheet.addRow(['Communication', formatToTwoDecimals(input.averageCScore) + '%']);
  sheet.addRow(['C1', 'Pitch Deck ', formatToTwoDecimals(input.businessProgressScore?.pitchFeedback) + '%']);

  const feedbackCRow = sheet.addRow(['AI Feedback', input.feedback?.communicationFeedback]);
  feedbackCRow.getCell(1).font = { bold: true };
  sheet.mergeCells(`B${feedbackCRow.number}:I${feedbackCRow.number}`);
  const feedbackCCell = sheet.getCell(`B${feedbackCRow.number}`);
  feedbackCCell.alignment = {
    wrapText: true,
    vertical: 'top',
    horizontal: 'left',
  };
  feedbackCRow.height = 140;

  sheet.addRow([]);

  const pitchStatementRow = sheet.addRow(['Fundraising and GTM Strategy', input.pitchStatement]);
  pitchStatementRow.getCell(1).font = { bold: true };

  sheet.mergeCells(`B${pitchStatementRow.number}:I${pitchStatementRow.number}`);
  const pitchStatementCell = sheet.getCell(`B${pitchStatementRow.number}`);
  pitchStatementCell.alignment = {
    wrapText: true,
    vertical: 'top',
    horizontal: 'left',
  };
  pitchStatementRow.height = 140;

  const recommendationRow = sheet.addRow(['', input.recommendation]);
  recommendationRow.getCell(2).font = { italic: true };
  sheet.mergeCells(`B${recommendationRow.number}:I${recommendationRow.number}`);
  const recommendationCell = sheet.getCell(`B${recommendationRow.number}`);
  recommendationCell.alignment = {
    wrapText: true,
    vertical: 'top',
    horizontal: 'left',
  };
  recommendationRow.height = 100;

  // GLOBAL ALIGNMENT (LEFT)
  sheet.columns.forEach((col) => {
    col.width = 20;
    col.alignment = {
      horizontal: 'left',
      vertical: 'middle',
      wrapText: true,
    };
  });

  return workbook.xlsx.writeBuffer();
}
