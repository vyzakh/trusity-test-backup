import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import * as PDFDocument from 'pdfkit';

interface PitchDeckData {
  id: any;
  businessName: any;
  idea: any;
  problemStatement: any;
  targetMarket: any;
  marketResearch: any;
  marketFit: any;
  prototypeDescription: any;
  businessModel: any;
  revenueModel: any;
  capex: Array<{ cost: number; name: string }>;
  capexTotal: string;
  opex: any[];
  sales: any[];
  breakeven: any[];
  breakevenPoint: string;
  financialProjectionsDescription: any;
  risksAndMitigations: any;
  futurePlans: any;
  branding: any;
  customerExperience: any;
  marketing: any;
  pitchDescription: any;
  marketCompetitors: any;
}

interface ExportPitchDeckInput {
  data: { businessId: string; callToAction: string };
}

export class ExportPitchDeckUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  private readonly colors = {
    text: '#000000',
    background: '#ffffff',
    border: '#000000',
  };

  async execute(input: ExportPitchDeckInput): Promise<string> {
    const { businessRepo } = this.dependencies;
    const pitchDeckData = await businessRepo.getBusiness({
      businessId: input.data.businessId,
    });

    if (!pitchDeckData) {
      throw new NotFoundException('The requested pitch deck could not be found. Please verify the business ID and try again.');
    }

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    const chunks: Uint8Array[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer.toString('base64'));
      });
      doc.on('error', (err) => reject(err));

      try {
        this.generatePitchDeck(doc, pitchDeckData, input.data.callToAction);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generatePitchDeck(doc: PDFKit.PDFDocument, data: PitchDeckData, callToAction: string): void {
    // Title Slide
    this.createBusinessNameSlide(doc, data);

    doc.addPage();
    this.createIdeaSlide(doc, data);

    // Problem
    doc.addPage();
    this.createProblemSlide(doc, data);

    // Solution
    doc.addPage();
    this.createSolutionSlide(doc, data);

    // Prototype
    doc.addPage();
    this.createPrototypeSlide(doc, data);

    // Target Market & Market Fit
    doc.addPage();
    this.createTargetMarketAndFitSlide(doc, data);

    // Marketing Strategy
    doc.addPage();
    this.createMarketingStrategySlide(doc, data);

    // Market Competition
    doc.addPage();
    this.createMarketCompetitionSlide(doc, data);

    // Revenue Model
    doc.addPage();
    this.createRevenueModelSlide(doc, data);

    // Start-up Costs (CAPEX)
    if (data.capex?.length) {
      doc.addPage();
      this.createStartupCostsCapexSlide(doc, data);
    }

    // Start-up Costs (OPEX)
    if (data.opex?.length) {
      doc.addPage();
      this.createStartupCostsOpexSlide(doc, data);
    }

    // Financial Projections (Sales)
    if (data.sales?.length) {
      doc.addPage();
      this.createFinancialProjectionsSalesSlide(doc, data);
    }

    // Financial Projections (Breakeven)
    if (data.breakeven?.length) {
      doc.addPage();
      this.createFinancialProjectionsBreakevenSlide(doc, data);
    }

    // Future Developments
    doc.addPage();
    this.createFutureDevelopmentsSlide(doc, data);

    // Call to Action
    doc.addPage();
    this.createCallToActionSlide(doc, data, callToAction);
  }

  // ==================== HELPER METHODS ====================

  private cleanMarkdownFormatting(text: string): string {
    if (!text) return text;

    let cleaned = text;

    // Remove markdown headers (## and ###)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

    // Remove bold formatting (**text** or __text__)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');

    // Remove italic formatting (*text* or _text_)
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

    // Clean up markdown links [text](url) - keep just the text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove HTML entities
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');

    // Clean up multiple consecutive newlines (more than 2)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  private createMultiPageSection(doc: PDFKit.PDFDocument, title: string, content: string, headerTitle?: string): void {
    const x = 40;
    let y = 120;
    const width = doc.page.width - 80;
    const padding = 20;
    const fontSize = 13;

    // Calculate available height on first page
    let availableHeight = doc.page.height - y - 40;

    // Draw section border and title on first page
    doc.rect(x, y, width, availableHeight).fill(this.colors.background);
    doc.rect(x, y, width, availableHeight).stroke(this.colors.border);

    doc
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(title, x + padding, y + padding, {
        width: width - 2 * padding,
        align: 'left',
      });

    // Split content into lines
    const lines = content.split('\n');
    let currentY = y + padding + 30;
    const maxY = doc.page.height - 60;

    doc.font('Helvetica').fontSize(fontSize);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Calculate height needed for this line
      const textHeight = doc.heightOfString(line, {
        width: width - 2 * padding,
        lineGap: 2,
      });

      // Check if we need a new page
      if (currentY + textHeight > maxY) {
        doc.addPage();
        this.addHeader(doc, `${headerTitle || title} (Continued)`);

        currentY = 120 + padding;

        // Draw border on new page
        const newPageHeight = doc.page.height - 120 - 40;
        doc.rect(x, 120, width, newPageHeight).fill(this.colors.background);
        doc.rect(x, 120, width, newPageHeight).stroke(this.colors.border);
      }

      // Draw the text
      doc
        .fillColor(this.colors.text)
        .font('Helvetica')
        .fontSize(fontSize)
        .text(line, x + padding, currentY, {
          width: width - 2 * padding,
          align: 'left',
          lineGap: 2,
        });

      currentY += textHeight + 3;
    }
  }

  private createTwoColumnMultiPageSection(
    doc: PDFKit.PDFDocument,
    section1Title: string,
    section1Content: string,
    section2Title: string,
    section2Content: string,
    mainHeaderTitle: string,
  ): void {
    const x = 40;
    const y = 120;
    const width = doc.page.width - 80;
    const padding = 20;
    const fontSize = 13;
    const secondaryHeaderFontSize = 13; // Secondary heading size

    // Try to fit both sections on one page first
    const section1Lines = section1Content.split('\n');
    const section2Lines = section2Content.split('\n');

    let currentY = y + padding;
    const maxY = doc.page.height - 60;

    // Section 1 - Market Research (Secondary Heading)
    doc
      .rect(x, y, width, (maxY - y) / 2 - 5)
      .fill(this.colors.background)
      .stroke(this.colors.border);

    doc
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .fontSize(secondaryHeaderFontSize)
      .text(section1Title, x + padding, currentY, {
        width: width - 2 * padding,
        align: 'left',
      });

    currentY += 22;
    doc.font('Helvetica').fontSize(fontSize);

    for (let i = 0; i < section1Lines.length; i++) {
      const line = section1Lines[i];
      const textHeight = doc.heightOfString(line, {
        width: width - 2 * padding,
        lineGap: 2,
      });

      if (currentY + textHeight > y + (maxY - y) / 2 - 5 - padding) {
        // Content overflow - switch to multi-page for section 1
        const fullContent = `${section1Title}\n\n${section1Content}\n\n\n${section2Title}\n\n${section2Content}`;
        this.createMultiPageSection(doc, 'Market Analysis', fullContent, mainHeaderTitle);
        return;
      }

      doc.text(line, x + padding, currentY, {
        width: width - 2 * padding,
        align: 'left',
        lineGap: 2,
      });

      currentY += textHeight + 2;
    }

    // Section 2 - Market Fit (Secondary Heading)
    const section2Y = y + (maxY - y) / 2 + 5;
    currentY = section2Y + padding;

    doc
      .rect(x, section2Y, width, (maxY - y) / 2 - 5)
      .fill(this.colors.background)
      .stroke(this.colors.border);

    doc
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .fontSize(secondaryHeaderFontSize)
      .text(section2Title, x + padding, currentY, {
        width: width - 2 * padding,
        align: 'left',
      });

    currentY += 22;
    doc.font('Helvetica').fontSize(fontSize);

    for (let i = 0; i < section2Lines.length; i++) {
      const line = section2Lines[i];
      const textHeight = doc.heightOfString(line, {
        width: width - 2 * padding,
        lineGap: 2,
      });

      if (currentY + textHeight > maxY - padding) {
        // Content overflow - switch to multi-page for both sections
        const fullContent = `${section1Title}\n\n${section1Content}\n\n\n${section2Title}\n\n${section2Content}`;
        this.createMultiPageSection(doc, 'Market Analysis', fullContent, mainHeaderTitle);
        return;
      }

      doc.text(line, x + padding, currentY, {
        width: width - 2 * padding,
        align: 'left',
        lineGap: 2,
      });

      currentY += textHeight + 2;
    }
  }

  // ==================== SLIDE CREATION METHODS ====================

  private createTitleSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    const pageWidth = doc.page.width - 80;
    const centerY = doc.page.height / 2;

    doc.rect(0, 0, doc.page.width, doc.page.height).fill(this.colors.background);

    doc
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .fontSize(42)
      .text(data.businessName || 'Business Pitch', 40, centerY - 120, {
        width: pageWidth,
        align: 'center',
      });

    if (data.idea) {
      doc
        .fillColor(this.colors.text)
        .font('Helvetica')
        .fontSize(11)
        .text(data.idea, 40, centerY - 40, {
          width: pageWidth,
          align: 'center',
        });
    }

    doc.rect(40, 40, pageWidth, doc.page.height - 80).stroke(this.colors.border);
  }
  private createBusinessNameSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    const pageWidth = doc.page.width - 80;
    const centerY = doc.page.height / 2;

    doc.rect(0, 0, doc.page.width, doc.page.height).fill(this.colors.background);

    doc
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .fontSize(42)
      .text(data.businessName || 'Business Pitch', 40, centerY - 20, {
        width: pageWidth,
        align: 'center',
      });

    doc.rect(40, 40, pageWidth, doc.page.height - 80).stroke(this.colors.border);
  }

  private createIdeaSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Idea'); // Header like Problem slide
    const content = this.cleanMarkdownFormatting(data.idea || 'Idea description not provided');
    this.createMultiPageSection(doc, 'Idea Description', content, 'Idea');
  }

  private createProblemSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Problem');
    const content = this.cleanMarkdownFormatting(data.problemStatement || 'Problem statement not provided');
    this.createMultiPageSection(doc, 'Problem Statement', content, 'Problem');
  }

  private createSolutionSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Solution');
    const content = this.cleanMarkdownFormatting(data.idea || 'Solution description not provided');
    this.createMultiPageSection(doc, 'Idea Description', content, 'Solution');
  }

  private createPrototypeSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Prototype');
    const content = this.cleanMarkdownFormatting(data.prototypeDescription || 'Prototype description not provided');
    this.createMultiPageSection(doc, 'Prototype Description', content, 'Prototype');
  }

  private createTargetMarketAndFitSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Target Market & Market Fit');

    const marketResearchContent = this.cleanMarkdownFormatting(data.marketResearch || 'Market research data not provided');
    const marketFitContent = this.cleanMarkdownFormatting(data.marketFit || 'Market fit analysis not provided');

    this.createTwoColumnMultiPageSection(doc, 'Market Research', marketResearchContent, 'Market Fit', marketFitContent, 'Target Market & Market Fit');
  }

  private createMarketingStrategySlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Marketing Strategy');
    const content = this.cleanMarkdownFormatting(data.marketing || 'Marketing strategy not provided');
    this.createMultiPageSection(doc, 'Marketing Plan', content, 'Marketing Strategy');
  }

  private createMarketCompetitionSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Market Competition');
    const content = this.cleanMarkdownFormatting(data.marketCompetitors || 'Competitor analysis not provided');
    this.createMultiPageSection(doc, 'Competitors', content, 'Market Competition');
  }

  private createRevenueModelSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Revenue Model');

    let content = '';

    if (data.revenueModel && typeof data.revenueModel === 'object') {
      content = `Revenue Model: ${data.revenueModel.revenueModel || 'Not specified'}\n\n`;
      content += `Currency: ${data.revenueModel.currencyCode || 'Not specified'}\n\n`;

      if (data.revenueModel.pricingStrategy) {
        content += `Pricing Strategy: ${data.revenueModel.pricingStrategy}\n\n`;
      }
    } else {
      content = 'Revenue model details not provided';
    }

    if (data.capexTotal) {
      content += `\nTotal CAPEX: ${data.capexTotal} ${data.revenueModel?.currencyCode || 'JPY'}`;
    }

    if (data.breakevenPoint) {
      content += `\n\nBreakeven Point: ${data.breakevenPoint}`;
    }

    const cleanContent = this.cleanMarkdownFormatting(content);
    this.createMultiPageSection(doc, 'Revenue Model Details', cleanContent, 'Revenue Model');
  }

  private createStartupCostsCapexSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Start-up Costs - CAPEX');

    const headers = ['Item', 'Cost (JPY)'];
    const rows = data.capex.map((item) => [item.name || 'Unnamed Item', item.cost.toLocaleString()]);
    rows.push(['TOTAL', data.capexTotal]);

    this.createTable(doc, 'Capital Expenditure Breakdown', headers, rows, 40, 120, doc.page.width - 80);
  }

  private createStartupCostsOpexSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Start-up Costs - OPEX');

    try {
      const headers = ['Month', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
      const rows: string[][] = [];

      if (data.opex && data.opex.length > 0 && data.opex[0].opex) {
        const opexData = data.opex[0].opex;
        const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

        months.forEach((month) => {
          const monthData = opexData[month];
          if (monthData) {
            const row = [
              month,
              (monthData.y1 || 0).toLocaleString(),
              (monthData.y2 || 0).toLocaleString(),
              (monthData.y3 || 0).toLocaleString(),
              (monthData.y4 || 0).toLocaleString(),
              (monthData.y5 || 0).toLocaleString(),
            ];
            rows.push(row);
          }
        });

        // Add yearly totals
        const yearTotals = ['TOTAL', 0, 0, 0, 0, 0];
        months.forEach((month) => {
          const monthData = opexData[month];
          if (monthData) {
            yearTotals[1] += monthData.y1 || 0;
            yearTotals[2] += monthData.y2 || 0;
            yearTotals[3] += monthData.y3 || 0;
            yearTotals[4] += monthData.y4 || 0;
            yearTotals[5] += monthData.y5 || 0;
          }
        });

        for (let i = 1; i <= 5; i++) {
          yearTotals[i] = yearTotals[i].toLocaleString();
        }
        rows.push(yearTotals as string[]);
      }

      if (rows.length === 0) {
        rows.push(['No OPEX data available', '-', '-', '-', '-', '-']);
      }

      this.createTable(doc, 'Operating Expenditure Details (JPY)', headers, rows, 40, 120, doc.page.width - 80);
    } catch (error) {
      console.error('Error processing OPEX data:', error);
      this.createTable(doc, 'Operating Expenditure Details', ['Status'], [['Error processing OPEX data']], 40, 120, doc.page.width - 80);
    }
  }

  private createFinancialProjectionsSalesSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Financial Projections - Sales');

    try {
      const headers = ['Month', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
      const rows: string[][] = [];

      if (data.sales && data.sales.length > 0 && data.sales[0]) {
        const salesData = data.sales[0];
        const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

        months.forEach((month) => {
          const monthData = salesData[month];
          if (monthData) {
            const row = [
              month,
              (monthData.y1 || 0).toLocaleString(),
              (monthData.y2 || 0).toLocaleString(),
              (monthData.y3 || 0).toLocaleString(),
              (monthData.y4 || 0).toLocaleString(),
              (monthData.y5 || 0).toLocaleString(),
            ];
            rows.push(row);
          }
        });

        // Add yearly totals
        const yearTotals = ['TOTAL', 0, 0, 0, 0, 0];
        months.forEach((month) => {
          const monthData = salesData[month];
          if (monthData) {
            yearTotals[1] += monthData.y1 || 0;
            yearTotals[2] += monthData.y2 || 0;
            yearTotals[3] += monthData.y3 || 0;
            yearTotals[4] += monthData.y4 || 0;
            yearTotals[5] += monthData.y5 || 0;
          }
        });

        for (let i = 1; i <= 5; i++) {
          yearTotals[i] = yearTotals[i].toLocaleString();
        }
        rows.push(yearTotals as string[]);
      }

      if (rows.length === 0) {
        rows.push(['No sales data available', '-', '-', '-', '-', '-']);
      }

      this.createTable(doc, '5-Year Sales Forecast (JPY)', headers, rows, 40, 120, doc.page.width - 80);
    } catch (error) {
      console.error('Error processing Sales data:', error);
      this.createTable(doc, '5-Year Sales Forecast', ['Status'], [['Error processing sales data']], 40, 120, doc.page.width - 80);
    }
  }

  private createFinancialProjectionsBreakevenSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Financial Projections - Breakeven');

    try {
      const headers = ['Month', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
      const rows: string[][] = [];

      if (data.breakeven && data.breakeven.length > 0 && data.breakeven[0]) {
        const breakevenData = data.breakeven[0];
        const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

        months.forEach((month) => {
          const monthData = breakevenData[month];
          if (monthData) {
            const row = [
              month,
              (monthData.y1 || 0).toLocaleString(),
              (monthData.y2 || 0).toLocaleString(),
              (monthData.y3 || 0).toLocaleString(),
              (monthData.y4 || 0).toLocaleString(),
              (monthData.y5 || 0).toLocaleString(),
            ];
            rows.push(row);
          }
        });

        // Add yearly totals
        const yearTotals = ['TOTAL', 0, 0, 0, 0, 0];
        months.forEach((month) => {
          const monthData = breakevenData[month];
          if (monthData) {
            yearTotals[1] += monthData.y1 || 0;
            yearTotals[2] += monthData.y2 || 0;
            yearTotals[3] += monthData.y3 || 0;
            yearTotals[4] += monthData.y4 || 0;
            yearTotals[5] += monthData.y5 || 0;
          }
        });

        for (let i = 1; i <= 5; i++) {
          yearTotals[i] = yearTotals[i].toLocaleString();
        }
        rows.push(yearTotals as string[]);
      }

      if (rows.length === 0) {
        rows.push(['No breakeven data available', '-', '-', '-', '-', '-']);
      }

      if (data.breakevenPoint) {
        rows.push(['Breakeven Point', data.breakevenPoint, '', '', '', '']);
      }

      this.createTable(doc, '5-Year Breakeven Analysis (JPY)', headers, rows, 40, 120, doc.page.width - 80);
    } catch (error) {
      console.error('Error processing Breakeven data:', error);
      this.createTable(doc, '5-Year Breakeven Analysis', ['Status'], [['Error processing breakeven data']], 40, 120, doc.page.width - 80);
    }
  }

  private createFutureDevelopmentsSlide(doc: PDFKit.PDFDocument, data: PitchDeckData): void {
    this.addHeader(doc, 'Future Developments');
    const content = this.cleanMarkdownFormatting(data.futurePlans || 'Future development plans not provided');
    this.createMultiPageSection(doc, 'Future Plans', content, 'Future Developments');
  }

  private createCallToActionSlide(doc: PDFKit.PDFDocument, data: PitchDeckData, callToAction: string): void {
    this.addHeader(doc, 'Call to Action');

    const pageWidth = doc.page.width - 80;
    const centerY = doc.page.height / 2;

    const ctaContent = callToAction || "Ready to transform the future together? Let's make this vision a reality!";

    doc
      .fillColor(this.colors.text)
      .font('Helvetica')
      .fontSize(24)
      .text(ctaContent, 40, centerY - 50, {
        width: pageWidth,
        align: 'center',
      });

    doc
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(data.businessName || 'Contact Us', 40, centerY + 50, {
        width: pageWidth,
        align: 'center',
      });
  }

  // ==================== BASIC LAYOUT METHODS ====================

  private addHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(this.colors.background);
    doc.rect(0, 0, doc.page.width, 80).stroke(this.colors.border);

    doc
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(title, 40, 25, {
        width: doc.page.width - 80,
        align: 'left',
      });
  }

  private createTable(doc: PDFKit.PDFDocument, title: string, headers: string[], rows: string[][], x: number, y: number, width: number): number {
    const rowHeight = 20;
    const headerHeight = 25;
    const padding = 6;

    doc
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(title, x, y - 25);

    const colWidth = width / headers.length;

    doc.rect(x, y, width, headerHeight).fill(this.colors.background).stroke(this.colors.border);

    headers.forEach((header, i) => {
      doc
        .fillColor(this.colors.text)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(header, x + i * colWidth + padding, y + padding, {
          width: colWidth - 2 * padding,
          align: 'center',
        });
    });

    rows.forEach((row, rowIndex) => {
      const rowY = y + headerHeight + rowIndex * rowHeight;

      doc.rect(x, rowY, width, rowHeight).fill(this.colors.background).stroke(this.colors.border);

      row.forEach((cell, colIndex) => {
        const fontSize = 13; //row[0] === 'TOTAL' ? 8 : 7;
        const fontStyle = row[0] === 'TOTAL' ? 'Helvetica-Bold' : 'Helvetica';

        doc
          .fillColor(this.colors.text)
          .font(fontStyle)
          .fontSize(fontSize)
          .text(cell || '-', x + colIndex * colWidth + padding, rowY + 4, {
            width: colWidth - 2 * padding,
            align: 'center',
          });
      });
    });

    return y + headerHeight + rows.length * rowHeight + 40;
  }
}
