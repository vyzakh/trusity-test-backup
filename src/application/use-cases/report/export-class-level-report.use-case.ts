import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { getConfigService } from '@infrastructure/config';
import { AiPerformanceFeedbackRepository, BusinessRepository, SchoolRepository, StudentRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate, genTimestamp, normalizeNumber } from '@shared/utils';
import { renderHtmlToPdf } from '@shared/utils/html-to-pdf.util';
import * as path from 'path';
const ExcelJS = require('exceljs/dist/es5');

interface ExportClassLevelReportUseCaseInput {
  data: {
    schoolId: string;
    gradeId: number;
    sectionId: number;
    status?: BusinessStatus;
    feedbackId: string;
    fileType: string;
  };
  user: ICurrentUser;
}

export class ExportClassLevelReportUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
      studentRepo: StudentRepository;
      businessRepo: BusinessRepository;
      s3Service: S3Service;
      aiPerformanceFeedbackRepo: AiPerformanceFeedbackRepository;
    },
  ) {}

  async execute(input: ExportClassLevelReportUseCaseInput) {
    const { schoolRepo, studentRepo, businessRepo, s3Service, aiPerformanceFeedbackRepo } = this.dependencies;
    const { data, user } = input;
    const configService = await getConfigService();

    const query: Record<string, any> = {
      schoolId: data.schoolId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      status: data.status,
      feedbackId: data.feedbackId,
      enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        query.schoolId = user.schoolId;
        break;
      }
      case UserScope.TEACHER: {
        query.schoolId = user.schoolId;
        break;
      }
      case UserScope.STUDENT: {
        query.schoolId = user.schoolId;
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const [school, [grade], [section], score, phaseScores, students, feedback, performanceProgression] = await Promise.all([
      schoolRepo.getSchool(query),
      schoolRepo.getSchoolGrades({
        schoolId: query.schoolId,
        gradeIds: [query.gradeId],
      }),
      schoolRepo.getSchoolGradeSections({
        schoolId: query.schoolId,
        gradeId: query.gradeId,
        sectionIds: [query.sectionId],
      }),
      businessRepo.getOverallSectionScore(query),
      businessRepo.getSectionPerformanceScores(query),
      studentRepo.getStudents({
        ...query,
        businessStatus: query.status,
      }),
      aiPerformanceFeedbackRepo.getFeedbackById({ feedbackId: query.feedbackId }),
      businessRepo.getSectionPerformanceProgression(query),
    ]);

    const studentReports: Record<string, any>[] = [];

    for (const student of students) {
      const studentQuery = {
        ...query,
        studentId: student.id,
      };

      const [[topBusiness], completedIdeasCount, { avgInnovationScore, avgEntrepreneurshipScore, avgCommunicationScore }, ats] = await Promise.all([
        businessRepo.getTopPerformedBusinesses(studentQuery),
        businessRepo.countBusinesses({
          studentId: student.id,
          status: BusinessStatus.COMPLETED,
          enrollmentStatus: query.enrollmentStatus,
        }),
        schoolRepo.getAverageBusinessScores({
          studentId: student.id,
          businessStatus: query.status,
          enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
        }),
        businessRepo.getTotalAverageScore({
          studentId: student.id,
          status: query.status,
          enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
        }),
      ]);

      studentReports.push({
        studentName: student?.name,
        topScore: topBusiness?.averageScores?.averageScore,
        businessName: topBusiness?.businessName,
        completedIdeasCount,
        avgInnovationScore: topBusiness?.averageScores?.avgIScore,
        avgEntrepreneurshipScore: topBusiness?.averageScores?.avgEScore,
        avgCommunicationScore: topBusiness?.averageScores?.avgCScore,
        ats,
        status: query.status,
        businessStatus: query.status,
      });
    }

    if (data.fileType === 'pdf') {
      const html = await compileHbsTemplate({
        templatePath: path.join(process.cwd(), 'src/presentation/views/report-templates/class-performance-report-view.hbs'),
        context: {
          reportGeneratedAt: genTimestamp().human,
          schoolName: school?.name || 'N/A',
          gradeName: grade?.grade?.name || 'N/A',
          sectionName: section?.section.name || 'N/A',
          overallScore: normalizeNumber(score),
          cis: phaseScores.cis,
          ces: phaseScores.ces,
          ccs: phaseScores.ccs,
          studentReports,
          feedback: feedback ? feedback.feedback : 'No feedback available.',
          performanceProgression,
          assetBaseUrl: configService.get<string>('app.assetBaseUrl'),
          businessStatus: query.status,
        },
      });

      const reportPDF = await renderHtmlToPdf({
        html,
        format: 'A4',
        landscape: false,
        printBackground: true,
        displayHeaderFooter: true,
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
        Class Performance Report
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

      if (!reportPDF) {
        throw new NotFoundException('The PDF report could not be generated. Please try again later.');
      }

      const buffer = Buffer.from(reportPDF);

      const pdfKey = `business-reports/${school?.name}_${grade?.grade?.name}_${section?.section.name}_Report.pdf`;

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
    } else if (data.fileType === 'excel') {
      const excelBuffer = await generateClassLevelReportExcel({
        reportGeneratedAt: genTimestamp().dmyDash,
        schoolName: school?.name || 'N/A',
        gradeName: grade?.grade?.name || 'N/A',
        sectionName: section?.section.name || 'N/A',
        overallScore: normalizeNumber(score),
        cis: phaseScores.cis,
        ces: phaseScores.ces,
        ccs: phaseScores.ccs,
        studentReports: studentReports.map((sr) => ({
          'Student Name': sr.studentName,
          'Top Score': sr.topScore ?? 0,
          'Business Idea Name': sr.businessName,
          'No. of Completed Ideas': sr.completedIdeasCount,
          I: sr.avgInnovationScore ?? 0,
          E: sr.avgEntrepreneurshipScore ?? 0,
          C: sr.avgCommunicationScore ?? 0,
          ATS: sr.ats?.totalAvgScore ?? 0,
          Status: query.status === undefined || query.status === null ? 'In-progress / Completed' : query.status === 'in_progress' ? 'In Progress' : 'Completed',
        })),
        feedback: feedback ? feedback.feedback : 'No feedback available.',
        businessStatus: query.status,
      });

      const excelKey = `business-reports/${school?.name}_${grade?.grade?.name}_${section?.section.name}_Report.xlsx`;

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

      return { downloadUrl, expiresIn };
    }
  }
}

export async function generateClassLevelReportExcel(input: {
  reportGeneratedAt: string;
  schoolName: string;
  gradeName: string;
  sectionName: string;
  overallScore: number;
  cis: number;
  ces: number;
  ccs: number;
  studentReports: Record<string, any>[];
  feedback: string;
  businessStatus?: string;
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Class Performance Report');

  // ===== PAGE SETUP =====
  sheet.pageSetup = {
    orientation: 'portrait',
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  // ===== META INFO =====
  const metaRows = [
    ['Report Generated At', input.reportGeneratedAt],
    ['School Name', input.schoolName],
    ['Grade', input.gradeName],
    ['Section', input.sectionName],
    ['Business Status', input.businessStatus ?? 'ALL'],
    ['Overall Class Score (OCS)', input.overallScore],
    ['Class Innovation Score (CIS)', input.cis],
    ['Class Entrepreneurship Score (CES)', input.ces],
    ['Class Communication Score (CCS)', input.ccs],
  ];

  metaRows.forEach((row) => {
    const r = sheet.addRow(row);
    r.getCell(1).font = { bold: true };

    if (typeof row[1] === 'number') {
      r.getCell(2).value = `${formatToTwoDecimals(row[1])}%`;
    }
  });

  sheet.addRow([]);

  // ===== STUDENT TABLE =====
  if (input.studentReports.length) {
    const headers = Object.keys(input.studentReports[0]);
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headers.forEach((_, i) => {
      sheet.getColumn(i + 1).width = 22;
    });
    for (const row of input.studentReports) {
      const excelRow = sheet.addRow(headers.map((h) => row[h]));

      excelRow.eachCell((cell: any) => {
        const columnHeader = headers[cell.col - 1];
        const numericColumns = ['Top Score', 'I', 'E', 'C', 'ATS'];
        if (typeof cell.value === 'number' && numericColumns.includes(columnHeader)) {
          cell.value = `${formatToTwoDecimals(cell.value)}%`;
        }
      });
    }
  } else {
    sheet.addRow(['No student data available']);
  }

  sheet.addRow([]);

  // ===== FEEDBACK =====
  const feedbackRow = sheet.addRow(['Class Overall Feedback', input.feedback]);
  feedbackRow.getCell(1).font = { bold: true };
  sheet.mergeCells(`B${feedbackRow.number}:I${feedbackRow.number}`);

  const feedbackCell = sheet.getCell(`B${feedbackRow.number}`);
  feedbackCell.alignment = {
    wrapText: true,
    vertical: 'top',
    horizontal: 'left',
  };

  feedbackRow.height = 140;

  // ===== GLOBAL ALIGNMENT (LEFT) =====
  sheet.columns.forEach((col) => {
    col.alignment = {
      horizontal: 'left',
      vertical: 'middle',
      wrapText: true,
    };
  });

  return workbook.xlsx.writeBuffer();
}

export function formatToTwoDecimals(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const str = String(Number(value));

  if (!str.includes('.')) {
    return Number(str);
  }

  const [intPart, decimalPart] = str.split('.');
  return Number(`${intPart}.${decimalPart.slice(0, 2)}`);
}
