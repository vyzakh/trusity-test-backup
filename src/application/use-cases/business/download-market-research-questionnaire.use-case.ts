import * as PDFDocument from 'pdfkit';

interface MarketResearchData {
  slNo: number;
  noCount: number;
  question: string;
  yesCount: number;
  noPercentage: number;
  yesPercentage: number;
}

interface DownloadMarketResearchQuestionnaireInput {
  downloadMarketResearchQuestionnaire: { businessId: string };
}

export class DownloadMarketResearchQuestionnaireUseCase {
  constructor(private readonly dependencies: { businessRepo: any }) {}

  private readonly colors = {
    text: '#000000',
    background: '#ffffff',
    border: '#000000',
    headerBg: '#f5f5f5',
  };

  async execute(input: DownloadMarketResearchQuestionnaireInput): Promise<string> {
    const { businessRepo } = this.dependencies;

    const businessData = await businessRepo.getBusiness({
      businessId: input.downloadMarketResearchQuestionnaire.businessId,
    });

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
        this.createMarketResearchTable(doc, businessData.marketQuestionnaire);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private createMarketResearchTable(doc: PDFKit.PDFDocument, data: MarketResearchData[]): void {
    this.addHeader(doc, 'Market Research Survey Results');

    const headers = ['No.', 'Question', 'Yes Count', 'No Count', 'Yes Percentage', 'No Percentage'];
    const startY = 120;
    const tableWidth = doc.page.width - 80;

    const colWidths = [40, 350, 70, 70, 100, 100];
    const rowHeight = 25;
    const headerHeight = 30;

    // Header row
    let currentX = 40;
    doc.rect(40, startY, tableWidth, headerHeight).fill(this.colors.headerBg).stroke(this.colors.border);

    headers.forEach((header, i) => {
      doc
        .fillColor(this.colors.text)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(header, currentX + 5, startY + 8, {
          width: colWidths[i] - 10,
          align: 'center',
        });

      if (i < headers.length - 1) {
        doc
          .moveTo(currentX + colWidths[i], startY)
          .lineTo(currentX + colWidths[i], startY + headerHeight)
          .stroke(this.colors.border);
      }

      currentX += colWidths[i];
    });

    // Data rows
    data.forEach((row, rowIndex) => {
      const rowY = startY + headerHeight + rowIndex * rowHeight;
      currentX = 40;

      doc.rect(40, rowY, tableWidth, rowHeight).fill(this.colors.background).stroke(this.colors.border);

      const rowData = [row.slNo.toString(), row.question, row.yesCount.toString(), row.noCount.toString(), `${row.yesPercentage}%`, `${row.noPercentage}%`];

      rowData.forEach((cellData, colIndex) => {
        const fontSize = colIndex === 1 ? 9 : 10;
        const align = colIndex === 1 ? 'left' : 'center';

        doc
          .fillColor(this.colors.text)
          .font('Helvetica')
          .fontSize(fontSize)
          .text(cellData, currentX + 5, rowY + 5, {
            width: colWidths[colIndex] - 10,
            height: rowHeight - 10,
            align,
          });

        if (colIndex < rowData.length - 1) {
          doc
            .moveTo(currentX + colWidths[colIndex], rowY)
            .lineTo(currentX + colWidths[colIndex], rowY + rowHeight)
            .stroke(this.colors.border);
        }

        currentX += colWidths[colIndex];
      });
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(this.colors.background);
    doc.rect(0, 0, doc.page.width, 80).stroke(this.colors.border);

    doc
      .fillColor(this.colors.text)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text(title, 40, 25, {
        width: doc.page.width - 80,
        align: 'left',
      });
  }
}
