import { UploadFileUseCase } from '@application/modules/media/use-cases/upload-file.use-case';
import { ICurrentStudentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { BusinessRepository, StudentRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate } from '@shared/utils';
import { renderHtmltoPdf } from '@shared/utils/business-summary.util';
import { formatMarketingPlanToHtml, markdownToHtml } from '@shared/utils/markdown-to-html.util';
import * as path from 'path';

interface ExportBusinessSummaryInput {
  data: {
    businessId: string;
  };
  user: ICurrentStudentUser;
}

export class ExportBusinessSummaryUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
      studentRepo: StudentRepository;
      s3Service: S3Service;
    },
  ) {}

  async execute(input: ExportBusinessSummaryInput): Promise<string> {
    const { businessRepo, studentRepo, s3Service } = this.dependencies;
    const { data, user } = input;

    const [business, student] = await Promise.all([businessRepo.getBusiness({ businessId: data.businessId }), studentRepo.getStudent({ userAccountId: user.userAccountId })]);

    if (!business) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const context = this.prepareTemplateContext(business, student, user);

    const html = await compileHbsTemplate({
      templatePath: path.join(process.cwd(), 'src/presentation/views/business-summary-pdf.hbs'),
      context,
    });

    if (!html) {
      throw new NotFoundException('The HTML content could not be generated');
    }

    const businessSummaryPDF = await renderHtmltoPdf({ html });
    if (!businessSummaryPDF) {
      throw new NotFoundException('The PDF could not be generated');
    }

    const buffer = Buffer.from(businessSummaryPDF);

    const result = await s3Service.uploadFile({
      key: `business-summaries/${UploadFileUseCase.generateFileName('business-summary.pdf')}`,
      body: buffer,
      contentType: 'application/pdf',
      acl: 'public-read',
    });

    return result.fileUrl;
  }

  private prepareTemplateContext(business: any, student: any, user: ICurrentStudentUser) {
    const stripMarkdown = (text: string | null | undefined): string => {
      if (!text) return '';
      return text
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/`{1,3}[^`]+`{1,3}/g, '')
        .replace(/^[-*+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .replace(/^>\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };
    let opexYears: { year: string; amount: number }[] = [];

    const opexData = business.opex?.[0]?.opex;

    if (opexData) {
      const yearTotals: { [key: string]: number } = {
        y1: 0,
        y2: 0,
        y3: 0,
        y4: 0,
        y5: 0,
      };

      const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

      months.forEach((month) => {
        const monthData = opexData[month];
        if (monthData) {
          Object.keys(yearTotals).forEach((year) => {
            const value = Number(monthData[year]) || 0;
            yearTotals[year] += value;
          });
        }
      });

      opexYears = Object.entries(yearTotals).map(([year, total]) => ({
        year: `Year ${year.replace('y', '')}`,
        amount: total,
      }));
    }

    const formatCurrency = (value: any): string => {
      const num = Number(value);
      if (isNaN(num)) return '0.00';
      return num.toFixed(2);
    };

    const marketResearch = business.marketResearchData || '';
    const marketResearchHtml = markdownToHtml(marketResearch);
    const revenueModel = business.revenueModel?.revenueModel ?? '';

    const goToMarket = markdownToHtml(business.launchStrategy);
    return {
      studentName: student.name || 'N/A',
      grade: user.gradeName || 'N/A',
      section: user.sectionName || 'N/A',
      businessName: business.businessName || 'Untitled Business',

      idea: business.idea,
      problemStatement: business.problemStatement,
      marketResearch: marketResearchHtml,
      prototypeDescription: business.prototypeDescription,
      valueProposition: business.businessModel?.valuePropositions,

      revenueModel,
      currencyCode: business.revenueModel?.currencyCode || '',
      averageSalePrice: formatCurrency(business.revenueModel?.unitSalesPercentage),

      capexTotal: formatCurrency(business.capexTotal),
      opexYears: opexYears.length > 0 ? opexYears : null,
      breakevenPoint: business.breakevenPoint,
      financialPlan: business.financialProjectionsDescription,

      marketingPlan: formatMarketingPlanToHtml(business.marketingFeedback),

      investmentPlan: business.investment.fundPitchStatement.pitchStatement,

      gtmStrategy: goToMarket,
    };
  }
}
