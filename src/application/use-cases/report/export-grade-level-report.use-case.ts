import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { getConfigService } from '@infrastructure/config';
import { AiPerformanceFeedbackRepository, BusinessRepository, SchoolRepository, StudentRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate, genTimestamp } from '@shared/utils';
import { renderHtmlToPdf } from '@shared/utils/html-to-pdf.util';
import * as path from 'path';
const ExcelJS = require('exceljs/dist/es5');

interface ExportGradeLevelReportUseCaseInput {
  data: {
    schoolId?: string;
    gradeIds: number[];
    sectionIds?: number[];
    status?: BusinessStatus;
    feedbackId: string;
    academicYearId?: string;
    enrollmentStatus?: EnrollmentStatusEnum;
    fileType: string;
  };
  user: ICurrentUser;
}

export class ExportGradeLevelReportUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
      s3Service: S3Service;
      schoolRepo: SchoolRepository;
      studentRepo: StudentRepository;
      aiPerformanceFeedbackRepo: AiPerformanceFeedbackRepository;
    },
  ) {}

  async execute(input: ExportGradeLevelReportUseCaseInput) {
    const { businessRepo, schoolRepo, studentRepo, s3Service, aiPerformanceFeedbackRepo } = this.dependencies;
    const { data, user } = input;
    const configService = await getConfigService();

    const query: Record<string, any> = {
      schoolId: data.schoolId,
      gradeIds: data.gradeIds,
      sectionIds: data.sectionIds,
      status: data.status,
      feedbackId: data.feedbackId,
      academicYearId: data.academicYearId,
      enrollmentStatus: data.enrollmentStatus ?? EnrollmentStatusEnum.ACTIVE,
    };

    const feedback = await aiPerformanceFeedbackRepo.getFeedbackById({ feedbackId: query.feedbackId });

    switch (user.scope) {
      case UserScope.PLATFORM_USER:
        break;

      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT:
        query.schoolId = user.schoolId;
        break;

      default:
        throw new ForbiddenException('You are not allowed to perform this action.');
    }
    try {
      const school = await schoolRepo.getSchool(query);
      let html: string | undefined = '';
      let reports: Record<string, any>[] = [];
      let ogs: Record<string, any> = {};
      let performanceProgression: any = null;
      let grades: any[] = [];
      let grade: any = null;
      let sections: any[] = [];
      let isSingleGradeWithSections = data.gradeIds.length == 1 && data.sectionIds?.length;
      let isMultipleGrades = data.gradeIds.length >= 1 && !data.sectionIds?.length;

      if (isSingleGradeWithSections) {
        query.gradeId = data.gradeIds[0];
        const ogsResult = await businessRepo.getOverallGradeScore(query);
        ogs.label = 'Overall Grade Score (OGS)';
        ogs.value = this.formatToTwoDecimals(ogsResult);
        sections = await schoolRepo.getSchoolGradeSections(query);
        grade = await schoolRepo.getSchoolGrade(query);
        performanceProgression = await businessRepo.getGradePerformanceProgression(query);
        for (const s of sections) {
          const sectionQuery = {
            ...query,
            sectionId: s.section.id,
          };
          const ocs = await businessRepo.getOverallSectionScore(sectionQuery);
          const businesses = await businessRepo.getTopPerformedBusinesses(sectionQuery);
          const topBusinesses: Record<string, any>[] = [];
          for (const business of businesses) {
            const businessStatus = await businessRepo.getBusinessStatus({ businessId: business?.id });
            topBusinesses.push({
              businessIdea: business?.businessName,
              businessStatus: businessStatus,
              businessCreatedBy: business?.student.name,
            });
          }
          const { cis, ces, ccs } = await businessRepo.getSectionPerformanceScores(sectionQuery);
          reports.push({
            gradeName: grade?.name + s.section.name,
            overallScore: {
              value: this.formatToTwoDecimals(ocs),
              label: 'Overall Class Score',
            },
            averageScore: {
              value: this.formatToTwoDecimals(businesses?.[0]?.averageScores?.averageScore ?? 0),
              label: 'Class Top Score',
            },
            topBusinesses,
            cis: {
              value: this.formatToTwoDecimals(cis),
              label: 'Class Innovation Score (CIS)',
            },
            ces: {
              value: this.formatToTwoDecimals(ces),
              label: 'Class Entrepreneurship Score (CES)',
            },
            ccs: {
              value: this.formatToTwoDecimals(ccs),
              label: 'Class Communication Score (CCS)',
            },
          });
        }
        html = await compileHbsTemplate({
          templatePath: path.join(process.cwd(), 'src/presentation/views/report-templates/grade-level-business-report-view.hbs'),
          context: {
            schoolName: school?.name || 'N/A',
            businessesStatus: data.status ? data.status : 'All',
            ogs,
            reports,
            graph: {
              performanceProgression: {
                problemStatement: this.formatToTwoDecimals(performanceProgression.problemStatement),
                marketResearch: this.formatToTwoDecimals(performanceProgression.marketResearch),
                marketFit: this.formatToTwoDecimals(performanceProgression.marketFit),
                prototype: this.formatToTwoDecimals(performanceProgression.prototype),
                businessModel: this.formatToTwoDecimals(performanceProgression.businessModel),
                financialPlanning: this.formatToTwoDecimals(performanceProgression.financialPlanning),
                marketing: this.formatToTwoDecimals(performanceProgression.marketing),
                pitchFeedback: this.formatToTwoDecimals(performanceProgression.pitchFeedback),
              },
              label: 'Overall Grade Performance',
            },
            assetBaseUrl: configService.get<string>('app.assetBaseUrl'),
            feedback: feedback ? feedback.feedback : 'No feedback available.',
            feedbackLabel: 'Grade Overall Feedback',
          },
        });
      }

      if (isMultipleGrades) {
        if (data.sectionIds?.length) {
          throw new NotFoundException('Section selection is not allowed when multiple grades are selected');
        }
        const ogsResult = await businessRepo.getOverallGradeScoreByGradeIds(query);
        ogs.label = 'Overall Score of Grades Chosen (OSGC)';
        ogs.value = this.formatToTwoDecimals(ogsResult.ogs);
        grades = await schoolRepo.getSchoolGrades({
          schoolId: query.schoolId,
          gradeIds: query.gradeIds,
        });
        performanceProgression = await businessRepo.getSchoolPerformanceProgression({
          schoolId: query.schoolId,
          gradeIds: query.gradeIds,
        });
        for (const g of grades) {
          const gradeQuery = {
            ...query,
            gradeId: g.grade.id,
          };
          const ogsGrade = await businessRepo.getOverallGradeScore(gradeQuery);
          const businesses = await businessRepo.getTopPerformedBusinesses(gradeQuery);
          const topBusinesses: Record<string, any>[] = [];
          for (const business of businesses) {
            const businessStatus = await businessRepo.getBusinessStatus({ businessId: business?.id });
            topBusinesses.push({
              businessIdea: business?.businessName,
              businessStatus: businessStatus,
              businessCreatedBy: business?.student.name,
            });
          }
          const { gis, ges, gcs } = await businessRepo.getGradePerformanceScores(gradeQuery);
          reports.push({
            gradeName: g.grade.name,
            overallScore: {
              value: this.formatToTwoDecimals(ogsGrade),
              label: 'Overall Grade Score',
            },
            averageScore: {
              value: this.formatToTwoDecimals(businesses?.[0]?.averageScores?.averageScore ?? 0),
              label: 'Grade Top Score',
            },
            topBusinesses,
            cis: {
              value: this.formatToTwoDecimals(gis),
              label: 'Grade Innovation Score (GIS)',
            },
            ces: {
              value: this.formatToTwoDecimals(ges),
              label: 'Grade Entrepreneurship Score (GES)',
            },
            ccs: {
              value: this.formatToTwoDecimals(gcs),
              label: 'Grade Communication Score (GCS)',
            },
          });
        }
        html = await compileHbsTemplate({
          templatePath: path.join(process.cwd(), 'src/presentation/views/report-templates/grade-level-business-report-view.hbs'),
          context: {
            schoolName: school?.name || 'N/A',
            businessesStatus: data.status ? data.status : 'All',
            ogs,
            reports,
            graph: {
              performanceProgression: {
                problemStatement: this.formatToTwoDecimals(performanceProgression.problemStatement),
                marketResearch: this.formatToTwoDecimals(performanceProgression.marketResearch),
                marketFit: this.formatToTwoDecimals(performanceProgression.marketFit),
                prototype: this.formatToTwoDecimals(performanceProgression.prototype),
                businessModel: this.formatToTwoDecimals(performanceProgression.businessModel),
                financialPlanning: this.formatToTwoDecimals(performanceProgression.financialPlanning),
                marketing: this.formatToTwoDecimals(performanceProgression.marketing),
                pitchFeedback: this.formatToTwoDecimals(performanceProgression.pitchFeedback),
              },
              label: 'Overall Performance of Grades Chosen',
            },
            assetBaseUrl: configService.get<string>('app.assetBaseUrl'),
            feedback: feedback ? feedback.feedback : 'No feedback available.',
            feedbackLabel: 'Grades Overall Feedback',
          },
        });
      }

      if (data.fileType === 'excel') {
        const excelRows = reports.map((r) => ({
          'Grade/Section': r.gradeName,
          [r.overallScore.label]: r.overallScore.value + '%',
          [r.averageScore.label]: r.averageScore.value + '%',
          'Top Businesses Idea': (r.topBusinesses || []).map((tb) => tb.businessIdea).join(', '),
          'Student Name': (r.topBusinesses || []).map((tb) => tb.businessCreatedBy).join(', '),
          Status: (r.topBusinesses || []).map((tb) => tb.businessStatus).join(', '),
          [r.cis.label]: r.cis.value + '%',
          [r.ces.label]: r.ces.value + '%',
          [r.ccs.label]: r.ccs.value + '%',
        }));

        const excelBuffer = await generateGradeLevelReportExcel({
          reportGeneratedAt: genTimestamp().dmyDash,
          schoolName: school?.name || 'N/A',
          businessStatus: data.status ?? 'ALL',
          ogs,
          reports: excelRows,
          feedback: feedback ? feedback.feedback : 'No feedback available.',
        });

        const excelKey = `business-reports/${school?.name}_Grade_Report.xlsx`;

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

      const reportPDF = await renderHtmlToPdf({
        html,
        format: 'A4',
        landscape: false,
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
            width:100%;
            padding:0 30px;
            box-sizing:border-box;
          ">
            <div style="
              display:flex;
              align-items:center;
              width:100%;
            ">
              <p style="
                font-family:'DM Sans', sans-serif;
                font-size:12px;
                margin:0;
                width:140px;
              ">
                Grade Level Report
              </p>

              <div style="
                margin-top:2px;
                width:100%;
                height:0;
                border-bottom:2px solid;
                border-image:linear-gradient(to right, #F79333, #93246A) 1;
              "></div>
            </div>
          </div>
        `,
      });

      if (!reportPDF) {
        throw new NotFoundException('The PDF report could not be generated. Please try again later.');
      }

      const buffer = Buffer.from(reportPDF);

      const pdfKey = `business-reports/${school?.name}_Grade_Report.pdf`;

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
      throw new BadRequestException('Failed to generate grade level report. Please try again later.', error);
    }
  }

  formatToTwoDecimals(value: number | string | null | undefined): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const str = String(Number(value ?? 0));

    if (!str.includes('.')) {
      return Number(str);
    }

    const [intPart, decimalPart] = str.split('.');
    return Number(`${intPart}.${decimalPart.slice(0, 2)}`);
  }
}

// Excel export for grade level report (outside class)
export async function generateGradeLevelReportExcel(input: {
  reportGeneratedAt: string;
  schoolName: string;
  businessStatus?: string;
  ogs: Record<string, any>;
  reports: Record<string, any>[];
  feedback: string;
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Grade Level Report');

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
    [input.ogs.label, input.ogs.value + '%'],
  ];
  metaRows.forEach((row) => {
    const r = sheet.addRow(row);
    r.getCell(1).font = { bold: true };
  });
  sheet.addRow([]);

  // REPORTS TABLE
  if (input.reports.length) {
    const headers = Object.keys(input.reports[0]);
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headers.forEach((_, i) => {
      sheet.getColumn(i + 1).width = 22;
    });
    for (const row of input.reports) {
      sheet.addRow(headers.map((h) => row[h]));
    }
  } else {
    sheet.addRow(['No grade/section data available']);
  }
  sheet.addRow([]);

  // FEEDBACK
  const feedbackRow = sheet.addRow(['Grade Overall Feedback', input.feedback]);
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
