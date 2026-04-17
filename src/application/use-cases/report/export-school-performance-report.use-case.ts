import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { getConfigService } from '@infrastructure/config';
import { AiPerformanceFeedbackRepository, BusinessRepository, SchoolRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { BusinessStatus } from '@shared/enums/business-status.enum';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { BadRequestException, ForbiddenException } from '@shared/execeptions';
import { compileHbsTemplate, genTimestamp } from '@shared/utils';
import { renderHtmlToPdf } from '@shared/utils/html-to-pdf.util';
const ExcelJS = require('exceljs/dist/es5');
import * as path from 'path';
import { formatToTwoDecimals } from './export-class-level-report.use-case';

const footerTemplate = `
<div style=" width: 100%; padding: 0 20px; box-sizing: border-box;">
<div style=" display: flex; align-items: center; width: 100%; gap: 10px;">
<p style=" font-family: 'Inter', sans-serif; font-weight: 400; font-size: 12px; color: #000000; flex-shrink: 0; letter-spacing: 0; margin: 0;">School Performance Report</p>
<div style=" margin-top: 2px; flex-grow: 1; height: 0; border-bottom: 2px solid; border-image: linear-gradient(to right, #F79333, #93246A) 1;"></div> 
</div>
</div>
  `;

const headerTemplate = `
<div style=" width:100%; padding: 0 30px; box-sizing:border-box;"> 
<p style=" text-align:right; font-size:12px; margin:0;">Date: ${genTimestamp().dmyDash}</p>
</div>
  `;

interface ExportSchoolPerformanceReportInput {
  data: {
    schoolId?: string | null;
    status?: BusinessStatus | null;
    feedbackId: string;
    fileType: string;
  };
  user: ICurrentUser;
}

export class ExportSchoolPerformanceReportUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
      s3Service: S3Service;
      schoolRepo: SchoolRepository;
      aiPerformanceFeedbackRepo: AiPerformanceFeedbackRepository;
    },
  ) {}

  async execute(input: ExportSchoolPerformanceReportInput) {
    const { businessRepo, s3Service, schoolRepo, aiPerformanceFeedbackRepo } = this.dependencies;
    const { data, user } = input;
    const configService = await getConfigService();

    const query: Record<string, any> = {
      schoolId: data.schoolId,
      status: data.status,
      feedbackId: data.feedbackId,
      enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
    };

    switch (user.scope) {
      case UserScope.STUDENT: {
        Object.assign(query, { schoolId: user.schoolId });
        break;
      }
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(query, { schoolId: user.schoolId });
        break;
      }
      case UserScope.TEACHER: {
        Object.assign(query, { schoolId: user.schoolId });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    try {
      const [school, schoolStats, uniqueBusinessCount, overallSchoolScore, overallSchoolPhaseScores, topPerformedBusinesses, schoolPerformanceProgression, feedback] =
        await Promise.all([
          schoolRepo.getSchool(query),
          schoolRepo.getSchoolStats(query),
          businessRepo.getUniqueBusinessCount(query),
          businessRepo.getOverallSchoolScore(query),
          businessRepo.getOverallSchoolPhaseScores(query),
          businessRepo.getTopPerformedBusinesses(query),
          businessRepo.getSchoolPerformanceProgression(query),
          aiPerformanceFeedbackRepo.getFeedbackById({ feedbackId: query.feedbackId }),
        ]);

      // Excel export logic
      if (data.fileType === 'excel') {
        // Prepare rows for excel
        const excelBuffer = await generateSchoolPerformanceReportExcel({
          reportGeneratedAt: genTimestamp().dmyDash,
          schoolName: school?.name || 'N/A',
          businessStatus: query.status ?? 'ALL',
          schoolStats: {
            'Total Number of Grades ': schoolStats.totalGrades,
            'Total Number of Students': schoolStats.totalStudents,
            'Total Number of Classes': schoolStats.totalSections,
          },
          uniqueBusinessCount,
          overallSchoolScore,
          overallSchoolPhaseScores: {
            'Overall School Innovation Score (OSIC)': overallSchoolPhaseScores.innovation,
            'Overall School Entrepreneurship Score (OSEC)': overallSchoolPhaseScores.entrepreneurship,
            'Overall School Communication Score (OSCC)': overallSchoolPhaseScores.communication,
          },
          topPerformedBusinesses: topPerformedBusinesses.map((b) => ({
            'Student Name ': b.student.name,
            'Business Idea': b.businessName,
            Grade: b.student.gradeName,
            Class: b.student.sectionName,
            I: b.averageScores.avgIScore,
            E: b.averageScores.avgEScore,
            C: b.averageScores.avgCScore,
            Average: b.averageScores.averageScore,
          })),
          feedback: feedback ? feedback.feedback : 'No feedback available.',
        });

        const excelKey = `business-reports/${school?.name}_Report.xlsx`;

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

      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

      const html = await compileHbsTemplate({
        templatePath: path.join(process.cwd(), 'src/presentation/views/report-templates/school-performance-report.hbs'),
        context: {
          reportGeneratedAt: genTimestamp().human,
          businessStatus: query.status,
          school,
          schoolStats,
          uniqueBusinessCount,
          overallSchoolScore,
          overallSchoolPhaseScores,
          topPerformedBusinesses,
          schoolPerformanceProgression,
          feedback: feedback ? feedback : 'No feedback available.',
          assetBaseUrl: configService.get<string>('app.assetBaseUrl'),
        },
      });

      const businessModelPDF = await renderHtmlToPdf({
        html,
        format: 'A4',
        landscape: false,
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: footerTemplate,
      });

      const buffer = Buffer.from(businessModelPDF);

      const pdfKey = `business-reports/${school?.name}_Report.pdf`;

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
    } catch (error) {
      throw new BadRequestException('Failed to generate school performance report.');
    }
  }
}

// Excel export for school performance report
export async function generateSchoolPerformanceReportExcel(input: {
  reportGeneratedAt: string;
  schoolName: string;
  businessStatus?: string;
  schoolStats: any;
  uniqueBusinessCount: number;
  overallSchoolScore: number;
  overallSchoolPhaseScores: Record<string, any>;
  topPerformedBusinesses: any[];
  feedback: string;
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('School Performance Report');

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
    ['School Name', input.schoolName],
    ['Business Status', input.businessStatus ?? 'ALL'],
    ['Overall School Score', input.overallSchoolScore],
  ];
  metaRows.forEach((row) => {
    const r = sheet.addRow(row);
    r.getCell(1).font = { bold: true };

    if (typeof row[1] === 'number') {
      r.getCell(2).value = `${formatToTwoDecimals(row[1])}%`;
    }
  });
  sheet.addRow([]);

  // SCHOOL STATS TABLE
  if (input.schoolStats) {
    (sheet.addRow(['Total Number of Unique Business Ideas', input.uniqueBusinessCount]),
      Object.entries(input.schoolStats).forEach(([key, value]) => {
        const r = sheet.addRow([key, value]);
        r.getCell(1).font = { bold: true };
      }));
    sheet.addRow([]);
  }

  // TOP PERFORMED BUSINESSES TABLE
  if (input.topPerformedBusinesses && input.topPerformedBusinesses.length) {
    sheet.addRow(['Best Idea']);
    const headers = Object.keys(input.topPerformedBusinesses[0]);
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headers.forEach((_, i) => {
      sheet.getColumn(i + 1).width = 22;
    });
    for (const row of input.topPerformedBusinesses) {
      const excelRow = sheet.addRow(headers.map((h) => row[h]));

      excelRow.eachCell((cell) => {
        if (typeof cell.value === 'number') {
          cell.value = `${formatToTwoDecimals(cell.value)}%`;
        }
      });
    }
    sheet.addRow([]);
  }

  // PHASE SCORES TABLE
  if (input.overallSchoolPhaseScores) {
    Object.entries(input.overallSchoolPhaseScores).forEach(([key, value]) => {
      const r = sheet.addRow([key, `${formatToTwoDecimals(value)}%`]);
      r.getCell(1).font = { bold: true };
    });
    sheet.addRow([]);
  }

  // FEEDBACK
  const feedbackRow = sheet.addRow(['School - Overall Feedback', input.feedback]);
  feedbackRow.getCell(1).font = { bold: true };
  sheet.mergeCells(`B${feedbackRow.number}:I${feedbackRow.number}`);
  const feedbackCell = sheet.getCell(`B${feedbackRow.number}`);
  feedbackCell.alignment = {
    wrapText: true,
    vertical: 'top',
    horizontal: 'left',
  };
  feedbackRow.height = 140;

  // GLOBAL ALIGNMENT (LEFT)
  sheet.columns.forEach((col) => {
    col.alignment = {
      horizontal: 'left',
      vertical: 'middle',
      wrapText: true,
    };
  });

  return workbook.xlsx.writeBuffer();
}
