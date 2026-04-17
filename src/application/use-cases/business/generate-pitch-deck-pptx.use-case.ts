import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { BusinessRepository } from '@infrastructure/database';
import { Injectable } from '@nestjs/common';
import { DeckType } from '@shared/enums/business-deck-type.enum';
import { BadRequestException, NotFoundException } from '@shared/execeptions';
import { marked } from 'marked';
import * as path from 'path';
const libre = require('libreoffice-convert');
const PptxGenJS = require('pptxgenjs');

type TableCell = {
  text: string;
  options?: {
    fill?: { color: string };
    color?: string;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    fontFace?: string;
    fontSize?: number;
    bold?: boolean;
  };
};

@Injectable()
export class GeneratePitchDeckPPTXUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
      s3Service: S3Service;
    },
  ) {}

  async execute(businessId: any, fileType: DeckType, templateCode: string, user: ICurrentUser) {
    const { businessRepo, s3Service } = this.dependencies;
    const pitchDeckData = await businessRepo.getBusiness({ businessId });

    if (!pitchDeckData) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    const studentName = user?.name || 'Student';

    const pptx = new PptxGenJS();

    switch (templateCode) {
      case 'Template_1':
        this.pptTemplate1({
          pptx,
          pitchDeckData,
          studentName,
        });
        break;
      case 'Template_2':
        this.pptTemplate2({
          pptx,
          pitchDeckData,
          studentName,
        });
        break;
      case 'Template_3':
        this.pptTemplate3({
          pptx,
          pitchDeckData,
          studentName,
        });
        break;
      default:
        throw new BadRequestException('Invalid Template Code');
    }

    // ---------- Upload Section ----------
    const uniqueFileName = `${pitchDeckData?.businessName || 'Pitch'}_${Date.now()}`;
    const pptxData = await pptx.stream();

    const pptxKey = `pitch-decks/${businessId}/${uniqueFileName}.pptx`;
    const pdfKey = `pitch-decks/${businessId}/${uniqueFileName}.pdf`;

    let pptxBuffer: Buffer;
    if (pptxData instanceof ArrayBuffer) {
      pptxBuffer = Buffer.from(pptxData);
    } else if (pptxData instanceof Uint8Array) {
      pptxBuffer = Buffer.from(pptxData);
    } else if (typeof pptxData === 'string') {
      pptxBuffer = Buffer.from(pptxData, 'base64');
    } else {
      throw new Error('Unsupported PPTX data type');
    }

    if (fileType === DeckType.PDF) {
      try {
        const pptxBufferToConvert = pptxBuffer;

        const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
          libre.convertWithOptions(pptxBufferToConvert, 'pdf', undefined, {}, (err, done) => {
            if (err) return reject(err);
            resolve(done);
          });
        });

        // Upload PDF to S3
        await s3Service.uploadFile({
          key: pdfKey,
          body: pdfBuffer,
          contentType: 'application/pdf',
          acl: 'private',
        });

        const pdfDownload = await s3Service.generateS3DownloadUrl({
          key: pdfKey,
          expiresIn: 604800,
          fileName: `${pitchDeckData?.businessName || 'Pitch'}_Deck.pdf`,
        });

        return pdfDownload.downloadUrl;
      } catch (err) {
        console.error('PDF generation failed:', err);
        return '';
      }
    }

    // Upload PPTX to S3
    await s3Service.uploadFile({
      key: pptxKey,
      body: pptxBuffer,
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      acl: 'private',
    });

    const pptxUrl = await s3Service.generateS3DownloadUrl({
      key: pptxKey,
      expiresIn: 604800,
      fileName: `${pitchDeckData?.businessName || 'Pitch'}_Deck.pptx`,
    });

    return pptxUrl.downloadUrl;
  }

  private pptTemplate2({ pptx, pitchDeckData, studentName }) {
    // Initialize PPTX
    pptx.defineLayout({ name: 'page', width: 20, height: 11.25 });
    pptx.layout = 'page';
    pptx.author = 'Trusity';
    pptx.company = 'Trusity Inc.';
    pptx.subject = 'Pitch Deck';
    pptx.title = `${pitchDeckData?.businessName || 'Business'} - Pitch Deck`;

    // ---------- SLIDE 1 ----------
    const slide1 = pptx.addSlide();
    slide1.background = { color: '#000000' };

    slide1.addShape(pptx.ShapeType.roundRect, {
      h: 1.09,
      w: 18.15,
      x: 1.02,
      y: 0.71,
      fill: { type: 'none' },
      line: { color: '#E5E1DA', width: 3 },
    });

    slide1.addImage({
      path: path.join(process.cwd(), 'public/assets/shape1.png'),
      h: 9.52,
      w: 13.25,
      x: 6.18,
      y: 0.32,
    });

    slide1.addImage({
      path: path.join(process.cwd(), 'public/assets/Picture1.png'),
      h: 0.58,
      w: 0.58,
      x: 1.28,
      y: 0.96,
    });

    slide1.addText('STARTUP PITCH DECK', {
      h: 4.62,
      w: 12.48,
      x: 1.02,
      y: 2.64,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 145,
    });

    slide1.addText(`Present by ${studentName}`, {
      h: 0.62,
      w: 8.49,
      x: 1.02,
      y: 7.47,
      color: '#FFFFFF',
      fontFace: 'Poppins',
      fontSize: 32,
    });

    const slide2 = pptx.addSlide();
    slide2.background = { color: '#000000' };

    slide2.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_2.1.png'),
      h: 10.2,
      w: 9.64,
      x: -1.25,
      y: -4.57,
    });

    slide2.addShape(pptx.ShapeType.roundRect, {
      h: 0.75,
      w: 9.55,
      rotate: 90,
      x: 4.85,
      y: 5.25,
      fill: { type: 'none' },
      line: { color: '#E5E1DA', width: 3 },
    });

    ['1.01', '4.39', '8.21'].forEach((y, index) => {
      slide2.addImage({
        path: path.join(process.cwd(), 'public/assets/slide_2.2.png'),
        w: 0.5,
        h: 0.5,
        x: 9.38,
        y: parseFloat(y),
      });
    });

    slide2.addText(pitchDeckData.problemStatement || 'No problem statement provided.', {
      h: 9.39,
      w: 8.16,
      x: 10.72,
      y: 1.01,
      color: '#FFFFFF',
      align: 'justify',
      valign: 'top',
      fontFace: 'Poppins',
      fontSize: 21,
    });

    slide2.addText('PROBLEM STATEMENT', {
      h: 1.93,
      w: 6.4,
      x: 1.13,
      y: 6.63,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 60,
    });

    slide2.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_2.3.png'),
      w: 0.98,
      h: 0.98,
      x: 1.13,
      y: 9.15,
    });

    const slide3 = pptx.addSlide();

    slide3.background = { color: '#000000' };

    slide3.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_3.1.png'),
      h: 7.7,
      w: 10.66,
      x: -7.5,
      y: -3.3,
    });

    slide3.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_3.2.png'),
      h: 10.66,
      w: 7.7,
      x: 16.75,
      y: -4.5,
    });

    slide3.addText('OUR INNOVATIVE SOLUTION', {
      h: 1.93,
      w: 7.76,
      x: 2.45,
      y: 1.12,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 60,
    });

    slide3.addText(pitchDeckData.idea, {
      h: 7.28,
      w: 15.19,
      x: 2.45,
      y: 3.3,
      color: '#FFFFFF',
      align: 'justify',
      valign: 'top',
      fontFace: 'Poppins',
      fontSize: 29,
    });

    slide3.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_2.2.png'),
      w: 0.79,
      h: 0.78,
      x: 11.96,
      y: 1.59,
    });

    slide3.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_3.3.png'),
      h: 1.49,
      w: 1.49,
      x: 12.5,
      y: 1.34,
    });

    const slide4 = pptx.addSlide();

    slide4.background = { color: '#000000' };

    slide4.addText('PROTOTYPE', {
      h: 1.01,
      w: 6.44,
      x: 1.03,
      y: 1.87,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 60,
    });

    slide4.addText(pitchDeckData.prototypeDescription, {
      h: 6.26,
      w: 14.64,
      x: 1.03,
      y: 3.13,
      color: '#FFFFFF',
      align: 'justify',
      valign: 'top',
      fontFace: 'Poppins',
      fontSize: 29,
    });

    slide4.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_4.1.png'),
      h: 3.7,
      w: 6.29,
      x: -2.49,
      y: 8.71,
    });

    slide4.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_4.2.png'),
      h: 16.16,
      w: 15.98,
      x: 12.97,
      y: -1.8,
    });

    slide4.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_2.3.png'),
      h: 0.71,
      w: 0.71,
      x: 15.82,
      y: 10.2,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.marketResearchData, {
      bgColor: '#000000',
      title: {
        text: 'TARGET MARKET',
        h: 1.08,
        w: 15,
        x: 2.31,
        y: 1.88,
        color: '#FFFFFF',
        fontFace: 'Poppins Bold',
        fontSize: 65,
      },
      images: [
        {
          path: path.join(process.cwd(), 'public/assets/2.png'),
          w: 7,
          x: 13,
          h: 11.25,
          y: 0,
          sizing: 'ccontain',
        },
        {
          path: path.join(process.cwd(), 'public/assets/1.png'),
          x: -9.06,
          y: -1.13,
          h: 15.89,
          w: 13.71,
        },
      ],
      content: {
        h: 6.72,
        w: 13.69,
        x: 2.51,
        y: 3.03,
        color: '#FFFFFF',
        align: 'justify',
        valign: 'top',
        fontFace: 'Poppins',
        fontSize: 22,
      },
      shapes: [
        {
          type: pptx.ShapeType.rect,
          x: '65%',
          y: 0,
          w: '35%',
          h: '100%',
          fill: {
            type: 'none',
          },
          line: { color: 'FFFFFF', width: 0 },
        },
        {
          type: 'rect',
          h: 8.9,
          w: 16.54,
          x: 1.23,
          y: 1.45,
          fill: { color: '#000000' },
          line: { color: 'FFFFFF', width: 0 },
        },
      ],
      maxWordsPerSlide: 103,
    });

    const slide = pptx.addSlide();

    slide.background = { color: '#000000' };

    slide.addShape(pptx.ShapeType.rect, {
      x: '65%',
      y: 0,
      w: '35%',
      h: '100%',
      fill: {
        type: 'none',
      },
      line: { color: 'FFFFFF', width: 0 },
    });

    slide.addImage({
      path: path.join(process.cwd(), 'public/assets/2.png'),
      w: '35%',
      x: '65%',
      h: '100%',
      y: 0,
      sizing: 'ccontain',
    });

    slide.addShape('rect', {
      h: 8.9,
      w: 16.54,
      x: 1.23,
      y: 1.45,
      fill: { color: '#000000' },
      line: { color: 'FFFFFF', width: 0 },
    });

    slide.addText('MARKET FIT', {
      h: 1.08,
      w: 15,
      x: 2.31,
      y: 1.88,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 65,
    });

    slide.addText(pitchDeckData.marketFit, {
      h: 6.72,
      w: 13.69,
      x: 2.51,
      y: 3.03,
      color: '#FFFFFF',
      align: 'justify',
      valign: 'top',
      fontFace: 'Poppins',
      fontSize: 22,
    });

    slide.addImage({
      path: path.join(process.cwd(), 'public/assets/1.png'),
      x: -9.06,
      y: -1.13,
      h: 15.89,
      w: 13.71,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.marketingFeedback, {
      bgColor: '#000000',
      title: {
        text: 'MARKETING STRATEGY',
        h: 1.93,
        w: 6.4,
        x: 1.13,
        y: 6.63,
        color: '#FFFFFF',
        fontFace: 'Poppins Bold',
        fontSize: 60,
      },
      content: {
        h: 9.39,
        w: 9.5,
        x: 10.33,
        y: 1.01,
        color: '#FFFFFF',
        align: 'justify',
        valign: 'top',
        fontFace: 'Poppins',
        fontSize: 20,
      },
      images: [
        { path: 'public/assets/slide_7.1.png', h: 10.2, w: 9.64, x: -1.2, y: -4.57 },
        { path: 'public/assets/slide_2.2.png', w: 0.5, h: 0.5, x: 9.38, y: 1.01 },
        { path: 'public/assets/slide_2.2.png', w: 0.5, h: 0.5, x: 9.38, y: 4.39 },
        { path: 'public/assets/slide_2.2.png', w: 0.5, h: 0.5, x: 9.38, y: 8.21 },
        { path: 'public/assets/slide_2.3.png', w: 0.98, h: 0.98, x: 1.13, y: 9.15 },
      ],
      shapes: [{ type: pptx.ShapeType.roundRect, h: 0.75, w: 9.55, x: 4.85, y: 5.25, rotate: 90, line: { color: '#E5E1DA', width: 3 } }],
      maxWordsPerSlide: 103,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.marketCompetitors, {
      bgColor: '#000000',
      title: {
        text: 'MARKET COMPETITION',
        h: 1.01,
        w: 9.51,
        x: 8.65,
        y: 2.28,
        color: '#FFFFFF',
        fontFace: 'Poppins Bold',
        fontSize: 60,
      },
      content: {
        h: 0.71,
        w: 9.87,
        x: 8.65,
        y: 4.06,
        fontSize: 22,
        fontFace: 'Poppins',
        color: '#FFFFFF',
      },
      images: [
        { path: 'public/assets/slide_2.3.png', h: 0.71, w: 0.71, x: 18.16, y: 0.77 },
        { path: 'public/assets/slide_6.1.png', h: 13.13, w: 12.3, x: -3.28, y: -0.13 },
        { path: 'public/assets/slide_6.2.png', h: 7.7, w: 10.66, x: 16.38, y: 8.15 },
      ],
      shapes: [{ type: pptx.ShapeType.roundRect, h: 0.71, w: 16.78, x: 1.13, y: 0.77, line: { color: '#E5E1DA', width: 3 } }],
      maxWordsPerSlide: 72,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.revenueModel.revenueModel, {
      bgColor: '#000000',
      title: {
        text: 'REVENUE MODEL',
        h: 0.83,
        w: 8.19,
        x: 6.61,
        y: 1.31,
        color: '#FFFFFF',
        fontFace: 'Poppins Bold',
        fontSize: 50,
        align: 'center',
      },
      images: [
        {
          path: path.join(process.cwd(), 'public/assets/slide_8.1.png'),
          h: 15.94,
          w: 15.86,
          x: -6.67,
          y: -2.87,
        },
      ],
      content: {
        h: 8.71,
        w: 11.14,
        x: 7.84,
        y: 2.14,
        color: '#FFFFFF',
        fontFace: 'Poppins',
        fontSize: 21,
      },
      maxWordsPerSlide: 103,
    });

    const slide9 = pptx.addSlide();

    slide9.background = { color: '#000000' };

    slide9.addText('STARTUP COSTS', {
      h: 1.24,
      w: 13.56,
      x: 1.13,
      y: 1.15,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 69,
    });

    slide9.addText('Capital Expenditures (CAPEX)', {
      h: 0.45,
      w: 4.74,
      x: 0.74,
      y: 2.47,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 21,
    });

    slide9.addText('Expense Calculation', {
      h: 0.45,
      w: 4.21,
      x: 10.28,
      y: 2.47,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 22,
    });

    slide9.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_9.1.png'),
      h: 15.48,
      w: 13.28,
      x: -4.95,
      y: 6.68,
    });

    const tableRows: TableCell[][] = [];

    tableRows.push([
      {
        text: 'CAPEX',
        options: {
          fill: { color: '#FBF9F1' },
          align: 'center',
          valign: 'middle',
          fontFace: 'Poppins',
          fontSize: 31,
          bold: true,
        },
      },
      {
        text: 'Costs',
        options: {
          fill: { color: '#FBF9F1' },
          align: 'center',
          valign: 'middle',
          fontFace: 'Poppins',
          fontSize: 31,
          bold: true,
        },
      },
    ]);

    pitchDeckData.capex.forEach((capex) =>
      tableRows.push([
        { text: capex.name, options: { align: 'center', valign: 'middle', fontFace: 'Poppins', fontSize: 18, color: '#FFFFFF', bold: true } },
        { text: capex.cost.toString(), options: { align: 'center', valign: 'middle', fontFace: 'Poppins', fontSize: 18, color: '#FFFFFF', bold: true } },
      ]),
    );

    slide9.addTable(tableRows, {
      x: 0.74,
      y: 3,
      colW: [5.65, 3.16],
      rowH: [1.17, ...Array(9).fill(0.72)],
      border: { type: 'solid', color: '#FFFF00', pt: 1 },
    });

    const table1Rows: TableCell[][] = [];

    table1Rows.push([
      {
        text: 'OPEX',
        options: {
          fill: { color: '#FBF9F1' },
          align: 'center',
          valign: 'middle',
          fontFace: 'Poppins',
          fontSize: 31,
          bold: true,
        },
      },
      {
        text: 'Costs',
        options: {
          fill: { color: '#FBF9F1' },
          align: 'center',
          valign: 'middle',
          fontFace: 'Poppins',
          fontSize: 31,
          bold: true,
        },
      },
    ]);

    this.extractOpexData(pitchDeckData.opex[0].opexExpense).forEach((opex) => {
      table1Rows.push([
        { text: opex.name, options: { align: 'center', valign: 'middle', fontFace: 'Poppins', fontSize: 18, color: '#FFFFFF', bold: true } },
        { text: opex.cost.toString(), options: { align: 'center', valign: 'middle', fontFace: 'Poppins', fontSize: 18, color: '#FFFFFF', bold: true } },
      ]);
    });

    slide9.addTable(table1Rows, {
      x: 10.28,
      y: 3,
      colW: [5.65, 3.16],
      rowH: [1.17, ...Array(9).fill(0.72)],
      border: { type: 'solid', color: '#FFFF00', pt: 1 },
    });

    const slide10 = pptx.addSlide();

    slide10.background = { color: '#000000' };

    slide10.addText('STARTUP COSTS', {
      h: 1.24,
      w: 13.56,
      x: 1.13,
      y: 1.15,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 69,
    });

    slide10.addText('Operating Expenses (OPEX)', {
      h: 0.49,
      w: 4.85,
      x: 0.83,
      y: 2.15,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 23,
    });

    slide10.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_9.1.png'),
      h: 15.48,
      w: 13.28,
      x: -4.95,
      y: 6.68,
    });

    const opexData = pitchDeckData.opex[0].opex;

    const table2Rows: TableCell[][] = [];

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthKeys = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
    const yearKeys = ['y1', 'y2', 'y3', 'y4', 'y5'];

    const headCellOptions = {
      fill: { color: '#FBF9F1' },
      align: 'center' as const,
      valign: 'middle' as const,
      fontFace: 'Poppins',
      fontSize: 21,
      bold: true,
    };

    const rowCellOptions = {
      align: 'center' as const,
      valign: 'middle' as const,
      color: '#FFFFFF',
      fontFace: 'Poppins',
      fontSize: 16.5,
      bold: true,
    };

    table2Rows.push([{ text: 'Month', options: headCellOptions }, ...yearKeys.map((y) => ({ text: y.replace('y', 'Year '), options: headCellOptions }))]);

    // Totals accumulator
    const totals: Record<string, number> = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

    // Month rows
    monthKeys.forEach((mKey, idx) => {
      const monthData = opexData[mKey] || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

      // Add to totals
      yearKeys.forEach((y) => {
        totals[y] += Number(monthData[y] ?? 0);
      });

      table2Rows.push([
        { text: months[idx], options: rowCellOptions },
        ...yearKeys.map((y) => ({
          text: String(monthData[y] ?? 0),
          options: rowCellOptions,
        })),
      ]);
    });

    // Totals row
    table2Rows.push([
      { text: 'Total OPEX', options: rowCellOptions },
      ...yearKeys.map((y) => ({
        text: String(totals[y]),
        options: rowCellOptions,
      })),
    ]);

    slide10.addTable(table2Rows, {
      x: 0.83,
      y: 2.68,
      colW: 3.03,
      rowH: 0.53,
      border: { type: 'solid', color: '#FFFF00', pt: 1 },
    });

    const slide11 = pptx.addSlide();

    slide11.background = { color: '#000000' };

    slide11.addText('FINANCIAL PROJECTIONS', {
      h: 1.24,
      w: 13.56,
      x: 0.85,
      y: 0.27,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 69,
    });

    slide11.addText('Sales', {
      h: 0.54,
      w: 2.1,
      x: 0.85,
      y: 1.4,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 26,
    });

    const table3Rows: TableCell[][] = [];

    table3Rows.push([
      {
        text: 'Sales Units',
        options: headCellOptions,
      },
      {
        text: 'Year 1',
        options: headCellOptions,
      },
      {
        text: 'Year 2',
        options: headCellOptions,
      },
      {
        text: 'Year 3',
        options: headCellOptions,
      },
      {
        text: 'Year 4',
        options: headCellOptions,
      },
      {
        text: 'Year 5',
        options: headCellOptions,
      },
    ]);

    const financialProjections = this.constructFinancialProjections(pitchDeckData);

    financialProjections.forEach((row, idx) => {
      table3Rows.push([
        { text: months[idx], options: rowCellOptions },
        { text: String(row.year1 || ''), options: rowCellOptions },
        { text: String(row.year2 || ''), options: rowCellOptions },
        { text: String(row.year3 || ''), options: rowCellOptions },
        { text: String(row.year4 || ''), options: rowCellOptions },
        { text: String(row.year5 || ''), options: rowCellOptions },
      ]);
    });

    const table3totals = this.calculateTotals(financialProjections);
    table3Rows.push([
      {
        text: 'Total',
        options: {
          align: 'center' as const,
          valign: 'middle' as const,
          color: '#FFFFFF',
          fontFace: 'Poppins',
          fontSize: 16.5,
          bold: true,
        },
      },
      { text: table3totals.year1, options: rowCellOptions },
      { text: table3totals.year2, options: rowCellOptions },
      { text: table3totals.year3, options: rowCellOptions },
      { text: table3totals.year4, options: rowCellOptions },
      { text: table3totals.year5, options: rowCellOptions },
    ]);

    slide11.addTable(table3Rows, {
      x: 0.85,
      y: 1.94,
      border: {
        color: '#FFFF00',
        type: 'solid',
        pt: 1,
      },
      colW: 3.05,
      rowH: 0.64,
    });

    const slide12 = pptx.addSlide();

    slide12.background = { color: '#000000' };

    slide12.addText('FINANCIAL PROJECTIONS', {
      h: 1.24,
      w: 13.56,
      x: 0.85,
      y: 0.27,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 69,
    });

    slide12.addText('Breakeven', {
      h: 0.54,
      w: 2.35,
      x: 0.85,
      y: 1.36,
      color: '#FFFFFF',
      fontFace: 'Poppins Bold',
      fontSize: 26,
    });

    const table4Rows: TableCell[][] = [];

    table4Rows.push([{ text: 'Month', options: headCellOptions }, ...yearKeys.map((y) => ({ text: y.replace('y', 'Year '), options: headCellOptions }))]);

    const breakeven = pitchDeckData.breakeven[0];

    const table4totals: Record<string, number> = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

    monthKeys.forEach((mKey, idx) => {
      const monthData = breakeven[mKey] || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

      table4totals.y1 += Number(monthData.y1) || 0;
      table4totals.y2 += Number(monthData.y2) || 0;
      table4totals.y3 += Number(monthData.y3) || 0;
      table4totals.y4 += Number(monthData.y4) || 0;
      table4totals.y5 += Number(monthData.y5) || 0;

      table4Rows.push([
        {
          text: months[idx],
          options: rowCellOptions,
        },
        {
          text: String(monthData.y1),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y2),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y3),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y4),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y5),
          options: rowCellOptions,
        },
      ]);
    });

    table4Rows.push([
      {
        text: 'Total',
        options: {
          align: 'center' as const,
          valign: 'middle' as const,
          color: '#FFFFFF',
          fontFace: 'Poppins',
          fontSize: 16.5,
          bold: true,
        },
      },
      {
        text: String(table4totals.y1),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y2),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y3),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y4),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y5),
        options: rowCellOptions,
      },
    ]);

    slide12.addTable(table4Rows, {
      x: 0.85,
      y: 1.9,
      border: {
        color: '#FFFF00',
        type: 'solid',
        pt: 1,
      },
      colW: 2.22,
      rowH: 0.62,
    });

    slide12.addText('BREAK-EVEN POINT', {
      h: 1.03,
      w: 3.91,
      x: 15.36,
      y: 4.18,
      color: '#FFFFFF',
      align: 'center',
      fontFace: 'Poppins Bold',
      fontSize: 32,
    });

    slide12.addShape(pptx.ShapeType.rect, {
      h: 0.93,
      w: 3.58,
      x: 15.52,
      y: 5.79,
      fill: '#FFFFFF',
    });

    slide12.addText(pitchDeckData.breakevenPoint, {
      h: 0.93,
      w: 3.58,
      x: 15.52,
      y: 5.79,
      align: 'center',
      valign: 'middle',
      color: '#000000',
      fontFace: 'Poppins',
      fontSize: 18,
      bold: true,
    });

    this.addFutureSlides(pptx, pitchDeckData.futurePlans, {
      bgColor: '#000000',
      title: {
        h: 1.25,
        w: 13.56,
        x: 1.13,
        y: 1.03,
        color: '#FFFFFF',
        fontFace: 'Poppins Bold',
        fontSize: 70,
      },
      content: {
        h: 1.36,
        w: 8.17,
        x: 1.13,
        y: 3.34,
        color: '#FFFFFF',
        align: 'justify',
        valign: 'top',
        fontFace: 'Poppins',
        fontSize: 23,
      },
      images: [{ path: 'public/assets/slide_8.1.png', h: 15.98, w: 15.9, x: 10, y: 1.66 }],
    });

    const slide13 = pptx.addSlide();

    slide13.background = { color: '#000000' };

    slide13.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_8.1.png'),
      h: 15.94,
      w: 15.86,
      x: -7.3,
      y: -6.17,
    });

    slide13.addImage({
      path: path.join(process.cwd(), 'public/assets/slide_8.1.png'),
      h: 15.94,
      w: 15.86,
      x: 10.5,
      y: 1.29,
    });

    slide13.addText('THANK YOU', {
      h: 2.59,
      w: 13.22,
      x: 3.39,
      y: 3.34,
      color: '#FFFFFF',
      align: 'center',
      fontFace: 'Poppins Bold',
      fontSize: 132,
    });
  }

  private pptTemplate1({ pptx, pitchDeckData, studentName }) {
    // Initialize PPTX
    pptx.defineLayout({ name: 'page', width: 20, height: 11.25 });
    pptx.layout = 'page';
    pptx.author = 'Trusity';
    pptx.company = 'Trusity Inc.';
    pptx.subject = 'Pitch Deck';
    pptx.title = `${pitchDeckData?.businessName || 'Business'} - Pitch Deck`;

    const slide1 = pptx.addSlide();
    slide1.background = { color: '#E8E8E3' };

    slide1.addText('PITCH DECK', {
      h: 4.15,
      w: 7.14,
      x: 12.86,
      y: 6.81,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 160,
    });

    slide1.addText(`PRESENTED BY: ${studentName}`, {
      h: 0.36,
      w: 5.44,
      x: 1.13,
      y: 1.13,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 18,
    });

    const slide2 = pptx.addSlide();
    slide2.background = { color: '#E8E8E3' };

    slide2.addImage({
      path: path.join(process.cwd(), 'public/image_1.png'),
      h: 5.24,
      w: 4.84,
      x: 1.13,
      y: 6.18,
    });

    slide2.addText(pitchDeckData.problemStatement || 'No problem statement provided.', {
      h: 5.76,
      w: 11.77,
      x: 7.1,
      y: 2.87,
      color: '#2D2D2D',
      align: 'justify',
      valign: 'top',
      fontFace: 'Arial',
      fontSize: 23,
    });

    slide2.addText('PROBLEM', {
      h: 0.67,
      w: 4.75,
      x: 1.13,
      y: 3.97,
      color: '#292B2D',
      fontFace: 'Arial',
      fontSize: 50,
    });

    const slide3 = pptx.addSlide();
    slide3.background = { color: '#E8E8E3' };

    slide3.addImage({
      path: path.join(process.cwd(), 'public/image_2.png'),
      h: 5.76,
      w: 5.34,
      x: 0.83,
      y: 5.43,
    });

    slide3.addText(pitchDeckData.idea, {
      h: 5.76,
      w: 11.77,
      x: 7.1,
      y: 2.87,
      color: '#2D2D2D',
      align: 'justify',
      valign: 'top',
      fontFace: 'Arial',
      fontSize: 23,
    });

    slide3.addText('SOLUTION', {
      h: 0.67,
      w: 4.75,
      x: 1.13,
      y: 3.97,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 50,
    });

    const slide4 = pptx.addSlide();

    slide4.background = { color: '#E8E8E3' };

    slide4.addText('PROTOTYPE', {
      h: 0.67,
      w: 4.75,
      x: 1.13,
      y: 3.97,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 50,
    });

    slide4.addImage({
      path: path.join(process.cwd(), 'public/image_3.png'),
      h: 4.78,
      w: 7.48,
      x: 0.5,
      y: 6.77,
    });

    slide4.addText(pitchDeckData.prototypeDescription, {
      h: 7.38,
      w: 10.54,
      x: 8.33,
      y: 2.87,
      color: '#2D2D2D',
      align: 'justify',
      valign: 'top',
      fontFace: 'Arial',
      fontSize: 23,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.marketResearchData, {
      bgColor: '#E8E8E3',
      title: {
        text: 'TARGET MARKET',
        h: 0.67,
        w: 4.75,
        x: 1.13,
        y: 3.97,
        color: '#2D2D2D',
        fontFace: 'Arial',
        fontSize: 50,
      },
      images: [
        {
          path: path.join(process.cwd(), 'public/image_4.png'),
          h: 5.82,
          w: 5.59,
          x: 0.65,
          y: 5.63,
        },
      ],
      content: {
        h: 5.76,
        w: 11.77,
        x: 7.1,
        y: 0.73,
        color: '#2D2D2D',
        fontFace: 'Arial',
        fontSize: 23,
      },
      maxWordsPerSlide: 103,
    });

    const slide6 = pptx.addSlide();

    slide6.background = { color: '#E8E8E3' };

    slide6.addText('MARKET FIT', {
      h: 0.67,
      w: 4.75,
      x: 1.13,
      y: 3.97,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 50,
    });

    slide6.addImage({
      path: path.join(process.cwd(), 'public/image_4.png'),
      h: 5.82,
      w: 5.59,
      x: 0.65,
      y: 5.63,
    });

    slide6.addText(pitchDeckData.marketFit, {
      h: 5.76,
      w: 11.77,
      x: 7.1,
      y: 2.87,
      color: '#2D2D2D',
      align: 'justify',
      valign: 'top',
      fontFace: 'Arial',
      fontSize: 23,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.marketingFeedback, {
      bgColor: '#E8E8E3',
      title: {
        text: 'MARKETING STRATEGY',
        h: 1.28,
        w: 6.16,
        x: 1.13,
        y: 3.97,
        color: '#2D2D2D',
        fontFace: 'Arial',
        fontSize: 50,
      },
      images: [
        {
          path: path.join(process.cwd(), 'public/image_6.png'),
          h: 5.25,
          w: 5.94,
          x: 0.47,
          y: 6.33,
        },
      ],
      content: {
        h: 5.76,
        w: 11.77,
        x: 7.1,
        y: 2.87,
        color: '#2D2D2D',
        fontFace: 'Arial',
        fontSize: 23,
      },
      maxWordsPerSlide: 103,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.marketCompetitors, {
      bgColor: '#E8E8E3',
      title: {
        text: 'MARKET COMPETITION',
        h: 1.28,
        w: 5.25,
        x: 1.13,
        y: 3.97,
        color: '#2D2D2D',
        fontFace: 'Arial',
        fontSize: 50,
      },
      images: [
        {
          path: path.join(process.cwd(), 'public/image_5.png'),
          h: 6.45,
          w: 7.18,
          x: 0.19,
          y: 5.63,
        },
      ],
      content: {
        h: 5.76,
        w: 11.77,
        x: 7.37,
        y: 1.09,
        color: '#2D2D2D',
        fontFace: 'Arial',
        fontSize: 23,
      },
      maxWordsPerSlide: 103,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.revenueModel.revenueModel, {
      bgColor: '#E8E8E3',
      title: {
        text: 'REVENUE MODEL',
        h: 1.28,
        w: 6.16,
        x: 1.13,
        y: 3.97,
        color: '#2D2D2D',
        fontFace: 'Arial',
        fontSize: 50,
      },
      images: [
        {
          path: path.join(process.cwd(), 'public/image_7.png'),
          h: 5.82,
          w: 5.59,
          x: 0.65,
          y: 5.63,
        },
      ],
      content: {
        h: 5.76,
        w: 11.77,
        x: 7.1,
        y: 2.87,
        color: '#2D2D2D',
        fontFace: 'Arial',
        fontSize: 23,
      },
      maxWordsPerSlide: 103,
    });

    const slide8 = pptx.addSlide();

    slide8.background = { color: '#E8E8E3' };

    slide8.addText('STARTUP COSTS', {
      h: 1.19,
      w: 13.56,
      x: 1.13,
      y: 1.2,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 69,
    });

    slide8.addText('Capital Expenditures (CAPEX)', {
      h: 0.45,
      w: 4.21,
      x: 0.74,
      y: 2.47,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 21,
    });

    slide8.addText('Expense Calculation', {
      h: 0.45,
      w: 4.21,
      x: 10.28,
      y: 2.47,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 22,
    });

    const tableRows: TableCell[][] = [];

    tableRows.push([
      {
        text: 'CAPEX',
        options: {
          align: 'center',
          valign: 'middle',
          fontFace: 'Arial',
          fontSize: 31,
          bold: true,
        },
      },
      {
        text: 'Costs',
        options: {
          align: 'center',
          valign: 'middle',
          fontFace: 'Arial',
          fontSize: 31,
          bold: true,
        },
      },
    ]);

    pitchDeckData.capex.forEach((capex) =>
      tableRows.push([
        { text: capex.name, options: { align: 'center', valign: 'middle', fontFace: 'Arial', fontSize: 18, color: '#2D2D2D', bold: true } },
        { text: capex.cost.toString(), options: { align: 'center', valign: 'middle', fontFace: 'Arial', fontSize: 18, color: '#2D2D2D', bold: true } },
      ]),
    );

    slide8.addTable(tableRows, {
      x: 0.74,
      y: 3,
      colW: [5.65, 3.16],
      rowH: [1.17, ...Array(20).fill(0.72)],
      border: { type: 'solid', color: '#2D2D2D', pt: 1 },
    });

    const table1Rows: TableCell[][] = [];

    table1Rows.push([
      {
        text: 'OPEX',
        options: {
          align: 'center',
          valign: 'middle',
          fontFace: 'Arial',
          fontSize: 31,
          bold: true,
        },
      },
      {
        text: 'Costs',
        options: {
          align: 'center',
          valign: 'middle',
          fontFace: 'Arial',
          fontSize: 31,
          bold: true,
        },
      },
    ]);

    this.extractOpexData(pitchDeckData.opex[0].opexExpense).forEach((opex) => {
      table1Rows.push([
        { text: opex.name, options: { align: 'center', valign: 'middle', fontFace: 'Arial', fontSize: 18, color: '#2D2D2D', bold: true } },
        { text: opex.cost.toString(), options: { align: 'center', valign: 'middle', fontFace: 'Arial', fontSize: 18, color: '#2D2D2D', bold: true } },
      ]);
    });

    slide8.addTable(table1Rows, {
      x: 10.28,
      y: 3,
      colW: [5.65, 3.16],
      rowH: [1.17, ...Array(9).fill(0.72)],
      border: { type: 'solid', color: '#2D2D2D', pt: 1 },
    });

    const slide9 = pptx.addSlide();

    slide9.background = { color: '#E8E8E3' };

    slide9.addText('STARTUP COSTS', {
      h: 1.19,
      w: 13.56,
      x: 0.83,
      y: 0.7,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 69,
    });

    slide9.addText('Operating Expenses (OPEX)', {
      h: 0.49,
      w: 4.85,
      x: 0.83,
      y: 1.99,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 23,
    });

    const opexData = pitchDeckData.opex[0].opex;

    const table2Rows: TableCell[][] = [];

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthKeys = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
    const yearKeys = ['y1', 'y2', 'y3', 'y4', 'y5'];

    const headCellOptions = {
      fill: { color: '#FFFFFF' },
      align: 'center' as const,
      valign: 'middle' as const,
      fontFace: 'Arial',
      fontSize: 18,
      bold: true,
    };

    const rowCellOptions = {
      align: 'center' as const,
      valign: 'middle' as const,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 16.5,
      bold: true,
    };

    table2Rows.push([{ text: 'Month', options: headCellOptions }, ...yearKeys.map((y) => ({ text: y.replace('y', 'Year '), options: headCellOptions }))]);

    // Totals accumulator
    const totals: Record<string, number> = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

    // Month rows
    monthKeys.forEach((mKey, idx) => {
      const monthData = opexData[mKey] || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

      // Add to totals
      yearKeys.forEach((y) => {
        totals[y] += Number(monthData[y] ?? 0);
      });

      table2Rows.push([
        { text: months[idx], options: rowCellOptions },
        ...yearKeys.map((y) => ({
          text: String(monthData[y] ?? 0),
          options: rowCellOptions,
        })),
      ]);
    });

    // Totals row
    table2Rows.push([
      { text: 'Total OPEX', options: rowCellOptions },
      ...yearKeys.map((y) => ({
        text: String(totals[y]),
        options: rowCellOptions,
      })),
    ]);

    slide9.addTable(table2Rows, {
      x: 0.83,
      y: 2.54,
      colW: 3.03,
      rowH: 0.53,
      border: { type: 'solid', color: '#2D2D2D', pt: 1 },
    });

    const slide10 = pptx.addSlide();

    slide10.background = { color: '#E8E8E3' };

    slide10.addText('FINANCIAL PROJECTIONS', {
      h: 1.19,
      w: 13.56,
      x: 1.51,
      y: 0.25,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 69,
    });

    slide10.addText('Sales', {
      h: 0.54,
      w: 2.82,
      x: 1.51,
      y: 1.44,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 26,
    });

    const table3Rows: TableCell[][] = [];

    table3Rows.push([
      {
        text: 'Sales Units',
        options: headCellOptions,
      },
      {
        text: 'Year 1',
        options: headCellOptions,
      },
      {
        text: 'Year 2',
        options: headCellOptions,
      },
      {
        text: 'Year 3',
        options: headCellOptions,
      },
      {
        text: 'Year 4',
        options: headCellOptions,
      },
      {
        text: 'Year 5',
        options: headCellOptions,
      },
    ]);

    const financialProjections = this.constructFinancialProjections(pitchDeckData);

    financialProjections.forEach((row, idx) => {
      table3Rows.push([
        { text: months[idx], options: rowCellOptions },
        { text: String(row.year1 || ''), options: rowCellOptions },
        { text: String(row.year2 || ''), options: rowCellOptions },
        { text: String(row.year3 || ''), options: rowCellOptions },
        { text: String(row.year4 || ''), options: rowCellOptions },
        { text: String(row.year5 || ''), options: rowCellOptions },
      ]);
    });

    const table3totals = this.calculateTotals(financialProjections);
    table3Rows.push([
      {
        text: 'Total',
        options: {
          align: 'center' as const,
          valign: 'middle' as const,
          color: '#2D2D2D',
          fontFace: 'Arial',
          fontSize: 16.5,
          bold: true,
        },
      },
      { text: table3totals.year1, options: rowCellOptions },
      { text: table3totals.year2, options: rowCellOptions },
      { text: table3totals.year3, options: rowCellOptions },
      { text: table3totals.year4, options: rowCellOptions },
      { text: table3totals.year5, options: rowCellOptions },
    ]);

    slide10.addTable(table3Rows, {
      x: 1.51,
      y: 2,
      border: {
        color: '#2D2D2D',
        type: 'solid',
        pt: 1,
      },
      colW: 2.83,
      rowH: 0.6,
    });

    const slide11 = pptx.addSlide();

    slide11.background = { color: '#E8E8E3' };

    slide11.addText('FINANCIAL PROJECTIONS', {
      h: 1.19,
      w: 13.56,
      x: 0.85,
      y: 0.32,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 69,
    });

    slide11.addText('Breakeven', {
      h: 0.54,
      w: 1.95,
      x: 0.85,
      y: 1.36,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 26,
    });

    const table4Rows: TableCell[][] = [];

    table4Rows.push([{ text: 'Month', options: headCellOptions }, ...yearKeys.map((y) => ({ text: y.replace('y', 'Year '), options: headCellOptions }))]);

    const breakeven = pitchDeckData.breakeven[0];

    const table4totals: Record<string, number> = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

    monthKeys.forEach((mKey, idx) => {
      const monthData = breakeven[mKey] || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

      table4totals.y1 += Number(monthData.y1) || 0;
      table4totals.y2 += Number(monthData.y2) || 0;
      table4totals.y3 += Number(monthData.y3) || 0;
      table4totals.y4 += Number(monthData.y4) || 0;
      table4totals.y5 += Number(monthData.y5) || 0;

      table4Rows.push([
        {
          text: months[idx],
          options: rowCellOptions,
        },
        {
          text: String(monthData.y1),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y2),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y3),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y4),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y5),
          options: rowCellOptions,
        },
      ]);
    });

    table4Rows.push([
      {
        text: 'Total',
        options: {
          align: 'center' as const,
          valign: 'middle' as const,
          color: '#2D2D2D',
          fontFace: 'Arial',
          fontSize: 16.5,
          bold: true,
        },
      },
      {
        text: String(table4totals.y1),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y2),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y3),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y4),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y5),
        options: rowCellOptions,
      },
    ]);

    slide11.addTable(table4Rows, {
      x: 0.85,
      y: 1.9,
      border: {
        color: '#2D2D2D',
        type: 'solid',
        pt: 1,
      },
      colW: 2.22,
      rowH: 0.62,
    });

    slide11.addText('BREAK-EVEN POINT', {
      h: 0.42,
      w: 3.91,
      x: 15.36,
      y: 4.19,
      color: '#292B2D',
      align: 'center',
      fontFace: 'Poppins Bold',
      fontSize: 32,
    });

    slide11.addShape(pptx.ShapeType.rect, {
      h: 1.08,
      w: 3.58,
      x: 15.52,
      y: 5.63,
      fill: '#000000',
    });

    slide11.addText(pitchDeckData.breakevenPoint, {
      h: 1.08,
      w: 3.58,
      x: 15.52,
      y: 5.63,
      align: 'center',
      valign: 'middle',
      color: '#FFFFFF',
      fontFace: 'Arial',
      fontSize: 18,
      bold: true,
    });

    this.addFutureSlides(pptx, pitchDeckData.futurePlans, {
      bgColor: '#E8E8E3',
      title: {
        h: 1.25,
        w: 13.56,
        x: 1.13,
        y: 1.03,
        color: '#2D2D2D',
        fontFace: 'Arial',
        fontSize: 70,
      },
      content: {
        h: 6.35,
        w: 17.56,
        x: 1.13,
        y: 3.34,
        color: '#2D2D2D',
        align: 'justify',
        valign: 'top',
        fontFace: 'Arial',
        fontSize: 23,
      },
      maxCharsPerSlide: 900,
    });

    const slide12 = pptx.addSlide();

    slide12.background = { color: '#E8E8E3' };

    slide12.addText('THANK', {
      h: 3.62,
      w: 17.41,
      x: 1.13,
      y: 2.01,
      color: '#292B2D',
      align: 'left',
      fontFace: 'Arial',
      fontSize: 249,
    });

    slide12.addText('YOU', {
      h: 3.62,
      w: 16.39,
      x: 1.8,
      y: 6.51,
      color: '#292B2D',
      align: 'right',
      fontFace: 'Arial',
      fontSize: 249,
    });
  }

  private pptTemplate3({ pptx, pitchDeckData, studentName }) {
    // Initialize PPTX
    pptx.defineLayout({ name: 'page', width: 20, height: 11.25 });
    pptx.layout = 'page';
    pptx.author = 'Trusity';
    pptx.company = 'Trusity Inc.';
    pptx.subject = 'Pitch Deck';
    pptx.title = `${pitchDeckData?.businessName || 'Business'} - Pitch Deck`;

    const slide1 = pptx.addSlide();
    slide1.background = { color: '#1B2341' };

    slide1.addShape(pptx.ShapeType.ellipse, {
      h: 5.7,
      w: 5.7,
      x: -3.28,
      y: -1.69,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 87 },
    });

    slide1.addShape(pptx.ShapeType.ellipse, {
      h: 10.9,
      w: 10.9,
      x: -6.35,
      y: -4.6,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 83 },
    });

    slide1.addText('Pitch Deck', {
      h: 4.21,
      w: 17.75,
      x: 1.13,
      y: 2.97,
      color: '#F8F6F7',
      fontFace: 'Helvetica 1',
      bold: true,
      fontSize: 224,
    });

    slide1.addShape(pptx.ShapeType.line, {
      h: 0,
      w: 17.75,
      x: 1.13,
      y: 8.64,
      fill: {
        type: 'none',
      },
      line: { color: '#F39223', width: 6, transparency: 37 },
    });

    slide1.addShape(pptx.ShapeType.ellipse, {
      h: 6.84,
      w: 6.84,
      x: 16.88,
      y: 7.29,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 87 },
    });

    slide1.addShape(pptx.ShapeType.ellipse, {
      h: 10.9,
      w: 10.9,
      x: 14.86,
      y: 5.57,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 83 },
    });

    slide1.addText(`Present by ${studentName}`, {
      h: 0.37,
      w: 8.31,
      x: 1.29,
      y: 9.21,
      color: '#F8F6F7',
      fontFace: 'Helvetica 1',
      fontSize: 27,
    });

    const slide2 = pptx.addSlide();
    slide2.background = { color: '#1B2341' };

    slide2.addText(pitchDeckData.problemStatement || 'No problem statement provided.', {
      h: 1.82,
      w: 7.09,
      x: 1.13,
      y: 3.81,
      color: '#FFFFFF',
      align: 'justify',
      valign: 'top',
      fontFace: 'Helvetica 1',
      fontSize: 24,
    });

    slide2.addText('Problem', {
      h: 1.36,
      w: 4.99,
      x: 1.13,
      y: 0.96,
      color: '#FFFFFF',
      fontFace: 'Helvetica 1',
      bold: true,
      fontSize: 66,
    });

    slide2.addShape(pptx.ShapeType.ellipse, {
      h: 5.7,
      w: 5.7,
      x: -3.28,
      y: -1.69,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 87 },
    });

    slide2.addShape(pptx.ShapeType.ellipse, {
      h: 10.9,
      w: 10.9,
      x: -6.35,
      y: -4.6,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 83 },
    });

    slide2.addShape(pptx.ShapeType.rect, {
      h: 11.25,
      w: 1.13,
      x: 18.88,
      y: 0,
      fill: {
        type: 'solid',
        color: '#F39223',
      },
    });

    slide2.addImage({
      path: path.join(process.cwd(), 'public//deck-3/slide_3.1.png'),
      h: 11.25,
      w: 9.51,
      x: 9.85,
      y: 0,
    });

    const slide3 = pptx.addSlide();
    slide3.background = { color: '#FFFFFF' };

    slide3.addImage({
      path: path.join(process.cwd(), 'public/deck-3/slide_4.1.jpg'),
      h: 4.67,
      w: 9.85,
      x: 0,
      y: 5.37,
    });

    slide3.addImage({
      path: path.join(process.cwd(), 'public/deck-3/slide_4.2.png'),
      h: 7.04,
      w: 8.9,
      x: -3.6,
      y: 6.93,
    });

    slide3.addText('Solution', {
      h: 1.24,
      w: 7.4,
      x: 1.13,
      y: 0.98,
      color: '#000000',
      fontFace: 'Helvetica 1',
      bold: true,
      fontSize: 66,
    });

    slide3.addText(pitchDeckData.idea, {
      h: 2.34,
      w: 7.19,
      x: 10.75,
      y: 1.25,
      color: '#260132',
      align: 'justify',
      valign: 'top',
      fontFace: 'Helvetica 1',
      fontSize: 24,
    });

    slide3.addShape(pptx.ShapeType.rect, {
      h: 11.25,
      w: 1.13,
      x: 18.88,
      y: 0,
      fill: {
        type: 'solid',
        color: '#F39223',
      },
    });

    const slide4 = pptx.addSlide();

    slide4.background = { color: '#1B2341' };

    slide4.addShape(pptx.ShapeType.rect, {
      h: 11.25,
      w: 1.13,
      x: 0,
      y: 0,
      fill: {
        type: 'solid',
        color: '#F39223',
      },
    });

    slide4.addShape(pptx.ShapeType.ellipse, {
      h: 5.7,
      w: 5.7,
      x: -3.28,
      y: -1.69,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 87 },
    });

    slide4.addShape(pptx.ShapeType.ellipse, {
      h: 10.9,
      w: 10.9,
      x: -6.35,
      y: -4.6,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 83 },
    });

    slide4.addText('Prototype', {
      h: 1.18,
      w: 6.35,
      x: 2.23,
      y: 0.98,
      color: '#FFFFFF',
      fontFace: 'Helvetica 1',
      bold: true,
      fontSize: 66,
    });

    slide4.addText(pitchDeckData.prototypeDescription, {
      h: 0.9,
      w: 16.3,
      x: 2.23,
      y: 2.82,
      color: '#FFFFFF',
      fontFace: 'Helvetica 1',
      fontSize: 24,
      align: 'justify',
      valign: 'top',
    });

    this.addMarkdownSlides(pptx, pitchDeckData.marketResearchData, {
      bgColor: '#1B2341',
      title: {
        text: 'Target Market',
        h: 2.14,
        w: 9.35,
        x: 1.13,
        y: 0.91,
        color: '#FFFFFF',
        fontFace: 'Helvetica 1',
        bold: true,
        fontSize: 66,
      },
      content: {
        h: 1.33,
        w: 16.41,
        x: 1.73,
        y: 3.52,
        color: '#0E0637',
        fontFace: 'Helvetica 1',
        fontSize: 18,
      },
      shapes: [
        {
          type: pptx.ShapeType.ellipse,
          h: 5.7,
          w: 5.7,
          x: -3.28,
          y: -1.69,
          rotate: 205,
          fill: {
            type: 'solid',
            color: '#FFFFFF',
            transparency: 99,
          },
          line: { color: '#FFFFFF', width: 1.5, transparency: 87 },
        },
        {
          type: pptx.ShapeType.ellipse,
          h: 10.9,
          w: 10.9,
          x: -6.35,
          y: -4.6,
          rotate: 205,
          fill: {
            type: 'solid',
            color: '#FFFFFF',
            transparency: 99,
          },
          line: { color: '#FFFFFF', width: 1.5, transparency: 83 },
        },
        {
          type: pptx.ShapeType.roundRect,
          h: 7.58,
          w: 17.74,
          x: 1.13,
          y: 2.86,
          fill: {
            type: 'solid',
            color: '#FFFFFF',
          },
        },
        {
          type: pptx.ShapeType.ellipse,
          h: 6.84,
          w: 6.84,
          x: 16.88,
          y: 7.29,
          rotate: 205,
          fill: {
            type: 'solid',
            color: '#FFFFFF',
            transparency: 99,
          },
          line: { color: '#FFFFFF', width: 1.5, transparency: 87 },
        },
        {
          type: pptx.ShapeType.ellipse,
          h: 10.9,
          w: 10.9,
          x: 14.86,
          y: 5.57,
          rotate: 205,
          fill: {
            type: 'solid',
            color: '#FFFFFF',
            transparency: 99,
          },
          line: { color: '#FFFFFF', width: 1.5, transparency: 83 },
        },
      ],
      maxWordsPerSlide: 103,
    });

    const slide6 = pptx.addSlide();

    slide6.background = { color: '#1B2341' };

    slide6.addShape(pptx.ShapeType.ellipse, {
      h: 5.7,
      w: 5.7,
      x: -3.28,
      y: -1.69,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 87 },
    });

    slide6.addShape(pptx.ShapeType.ellipse, {
      h: 10.9,
      w: 10.9,
      x: -6.35,
      y: -4.6,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 83 },
    });

    slide6.addText('Market Fit', {
      h: 2.14,
      w: 9.35,
      x: 1.13,
      y: 0.91,
      color: '#FFFFFF',
      fontFace: 'Helvetica 1',
      bold: true,
      fontSize: 66,
    });

    slide6.addShape(pptx.ShapeType.roundRect, {
      h: 7.58,
      w: 17.74,
      x: 1.13,
      y: 2.86,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
      },
    });

    slide6.addText(pitchDeckData.marketFit, {
      h: 1.33,
      w: 16.41,
      x: 1.73,
      y: 3.52,
      color: '#0E0637',
      fontFace: 'Helvetica 1',
      fontSize: 18,
    });

    slide6.addShape(pptx.ShapeType.ellipse, {
      h: 6.84,
      w: 6.84,
      x: 16.88,
      y: 7.29,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 87 },
    });

    slide6.addShape(pptx.ShapeType.ellipse, {
      h: 10.9,
      w: 10.9,
      x: 14.86,
      y: 5.57,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 83 },
    });

    this.addMarkdownSlides(pptx, pitchDeckData.marketingFeedback, {
      bgColor: '#FFFFFF',
      title: {
        text: 'Market Strategy',
        h: 1.24,
        w: 7.19,
        x: 8.06,
        y: 0.98,
        color: '#260132',
        fontFace: 'Helvetica 1',
        bold: true,
        fontSize: 66,
      },
      images: [
        {
          path: path.join(process.cwd(), 'public/deck-3/slide_8.1.png'),
          h: 8.76,
          w: 5.33,
          x: 1.12,
          y: 1.36,
        },
      ],
      content: {
        h: 1.86,
        w: 9.81,
        x: 8.06,
        y: 2.86,
        color: '#260132',
        fontFace: 'Helvetica 1',
        fontSize: 22,
      },
      shapes: [
        {
          type: pptx.ShapeType.rect,
          h: 0.78,
          w: 20,
          x: 0,
          y: 10.47,
          fill: {
            type: 'solid',
            color: '#1B2341',
          },
        },
      ],
      maxWordsPerSlide: 103,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.marketCompetitors, {
      bgColor: '#FFFFFF',
      title: {
        text: 'Market Competition',
        h: 2.14,
        w: 9.35,
        x: 1.13,
        y: 0.91,
        color: '#260132',
        fontFace: 'Helvetica 1',
        bold: true,
        fontSize: 66,
      },
      images: [
        {
          path: path.join(process.cwd(), 'public/deck-3/slide_7.1.png'),
          h: 5.03,
          w: 7.55,
          x: 1.13,
          y: 4.11,
        },
      ],
      content: {
        h: 5.26,
        w: 9.35,
        x: 10,
        y: 2.73,
        color: '#260132',
        fontFace: 'Helvetica 1',
        fontSize: 24,
      },
      shapes: [
        {
          type: pptx.ShapeType.rect,
          h: 1.13,
          w: 20,
          x: 0,
          y: 10.13,
          fill: {
            type: 'solid',
            color: '#1B2341',
          },
        },
      ],
      maxWordsPerSlide: 72,
    });

    this.addMarkdownSlides(pptx, pitchDeckData.revenueModel.revenueModel, {
      bgColor: '#FFFFFF',
      title: {
        text: 'Revenue Model',
        h: 1.24,
        w: 7.19,
        x: 8.06,
        y: 0.98,
        color: '#260132',
        fontFace: 'Helvetica 1',
        bold: true,
        fontSize: 66,
      },
      images: [
        {
          path: path.join(process.cwd(), 'public/deck-3/slide_8.1.png'),
          h: 8.76,
          w: 5.33,
          x: 1.12,
          y: 1.36,
        },
      ],
      content: {
        h: 1.86,
        w: 9.81,
        x: 8.06,
        y: 2.86,
        color: '#260132',
        fontFace: 'Helvetica 1',
        fontSize: 22,
      },
      shapes: [
        {
          type: pptx.ShapeType.rect,
          h: 0.78,
          w: 20,
          x: 0,
          y: 10.47,
          fill: {
            type: 'solid',
            color: '#1B2341',
          },
        },
      ],
      maxWordsPerSlide: 103,
    });

    const slide8 = pptx.addSlide();

    slide8.background = { color: '#FFFFFF' };

    slide8.addText('Start Up Cost ', {
      h: 1.24,
      w: 7.07,
      x: 1.13,
      y: 1.13,
      color: '#260132',
      fontFace: 'Helvetica 1',
      bold: true,
      fontSize: 66,
    });

    slide8.addText('Capital Expenditures (CAPEX)', {
      h: 0.45,
      w: 4.21,
      x: 0.74,
      y: 2.47,
      color: '#260132',
      fontFace: 'Helvetica 1',
      fontSize: 21,
    });

    slide8.addText('Expense Calculation', {
      h: 0.45,
      w: 4.21,
      x: 10.28,
      y: 2.47,
      color: '#260132',
      fontFace: 'Helvetica 1',
      fontSize: 22,
    });

    const tableRows: TableCell[][] = [];

    tableRows.push([
      {
        text: 'CAPEX',
        options: {
          fill: { color: '#FFD944' },
          align: 'center',
          valign: 'middle',
          fontFace: 'Helvetica 2',
          fontSize: 31,
          bold: true,
        },
      },
      {
        text: 'Costs',
        options: {
          fill: { color: '#FFD944' },
          align: 'center',
          valign: 'middle',
          fontFace: 'Helvetica 2',
          fontSize: 31,
          bold: true,
        },
      },
    ]);

    pitchDeckData.capex.forEach((capex) =>
      tableRows.push([
        { text: capex.name, options: { align: 'center', valign: 'middle', fontFace: 'Helvetica 2', fontSize: 18, color: '#000000', bold: true } },
        { text: capex.cost.toString(), options: { align: 'center', valign: 'middle', fontFace: 'Helvetica 2', fontSize: 18, color: '#000000', bold: true } },
      ]),
    );

    slide8.addTable(tableRows, {
      x: 0.74,
      y: 3,
      colW: [5.65, 3.16],
      rowH: [1.17, ...Array(20).fill(0.72)],
      border: { type: 'solid', color: '#FDCA40', pt: 1 },
    });

    const table1Rows: TableCell[][] = [];

    table1Rows.push([
      {
        text: 'OPEX',
        options: {
          fill: { color: '#FFD944' },
          align: 'center',
          valign: 'middle',
          fontFace: 'Helvetica 2',
          fontSize: 31,
          bold: true,
        },
      },
      {
        text: 'Costs',
        options: {
          fill: { color: '#FFD944' },
          align: 'center',
          valign: 'middle',
          fontFace: 'Helvetica 2',
          fontSize: 31,
          bold: true,
        },
      },
    ]);

    this.extractOpexData(pitchDeckData.opex[0].opexExpense).forEach((opex) => {
      table1Rows.push([
        { text: opex.name, options: { align: 'center', valign: 'middle', fontFace: 'Helvetica 2', fontSize: 18, color: '#000000', bold: true } },
        { text: opex.cost.toString(), options: { align: 'center', valign: 'middle', fontFace: 'Helvetica 2', fontSize: 18, color: '#000000', bold: true } },
      ]);
    });

    slide8.addTable(table1Rows, {
      x: 10.28,
      y: 3,
      colW: [5.65, 3.16],
      rowH: [1.17, ...Array(9).fill(0.72)],
      border: { type: 'solid', color: '#FDCA40', pt: 1 },
    });

    slide8.addShape(pptx.ShapeType.rect, {
      h: 11.25,
      w: 0.44,
      x: 19.56,
      y: 0,
      fill: {
        type: 'solid',
        color: '#1B2341',
      },
    });

    const slide9 = pptx.addSlide();

    slide9.background = { color: '#FFFFFF' };

    slide9.addText('Start Up Cost', {
      h: 1.19,
      w: 13.56,
      x: 0.83,
      y: 0.7,
      color: '#1B2341',
      fontFace: 'Helvetica 1',
      fontSize: 66,
    });

    slide9.addText('Operating Expenses (OPEX)', {
      h: 0.49,
      w: 4.85,
      x: 0.83,
      y: 1.99,
      color: '#2D2D2D',
      fontFace: 'Arial',
      fontSize: 23,
    });

    const opexData = pitchDeckData.opex[0].opex;

    const table2Rows: TableCell[][] = [];

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthKeys = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
    const yearKeys = ['y1', 'y2', 'y3', 'y4', 'y5'];

    const headCellOptions = {
      fill: { color: '#FFD944' },
      align: 'center' as const,
      valign: 'middle' as const,
      fontFace: 'Helvetica 2',
      fontSize: 18,
      bold: true,
    };

    const rowCellOptions = {
      align: 'center' as const,
      valign: 'middle' as const,
      color: '#000000',
      fontFace: 'Helvetica 2',
      fontSize: 16.5,
      bold: true,
    };

    table2Rows.push([{ text: 'Month', options: headCellOptions }, ...yearKeys.map((y) => ({ text: y.replace('y', 'Year '), options: headCellOptions }))]);

    // Totals accumulator
    const totals: Record<string, number> = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

    // Month rows
    monthKeys.forEach((mKey, idx) => {
      const monthData = opexData[mKey] || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

      // Add to totals
      yearKeys.forEach((y) => {
        totals[y] += Number(monthData[y] ?? 0);
      });

      table2Rows.push([
        { text: months[idx], options: rowCellOptions },
        ...yearKeys.map((y) => ({
          text: String(monthData[y] ?? 0),
          options: rowCellOptions,
        })),
      ]);
    });

    // Totals row
    table2Rows.push([
      { text: 'Total OPEX', options: rowCellOptions },
      ...yearKeys.map((y) => ({
        text: String(totals[y]),
        options: rowCellOptions,
      })),
    ]);

    slide9.addTable(table2Rows, {
      x: 0.83,
      y: 2.54,
      colW: 3.03,
      rowH: 0.53,
      border: { type: 'solid', color: '#2D2D2D', pt: 1 },
    });

    slide9.addShape(pptx.ShapeType.rect, {
      h: 11.25,
      w: 0.44,
      x: 19.56,
      y: 0,
      fill: {
        type: 'solid',
        color: '#1B2341',
      },
    });

    const slide10 = pptx.addSlide();
    slide10.background = { color: '#FFFFFF' };

    slide10.addText('Financial Projections', {
      h: 1.19,
      w: 13.56,
      x: 1.51,
      y: 0.25,
      color: '#1B2341',
      fontFace: 'Helvetica 1',
      bold: true,
      fontSize: 66,
    });

    slide10.addText('Sales', {
      h: 0.54,
      w: 2.82,
      x: 1.51,
      y: 1.44,
      color: '#1B2341',
      fontFace: 'Helvetica 1',
      fontSize: 26,
    });

    const table3Rows: TableCell[][] = [];

    table3Rows.push([
      {
        text: 'Sales Units',
        options: headCellOptions,
      },
      {
        text: 'Year 1',
        options: headCellOptions,
      },
      {
        text: 'Year 2',
        options: headCellOptions,
      },
      {
        text: 'Year 3',
        options: headCellOptions,
      },
      {
        text: 'Year 4',
        options: headCellOptions,
      },
      {
        text: 'Year 5',
        options: headCellOptions,
      },
    ]);

    const financialProjections = this.constructFinancialProjections(pitchDeckData);

    financialProjections.forEach((row, idx) => {
      table3Rows.push([
        { text: months[idx], options: rowCellOptions },
        { text: String(row.year1 || ''), options: rowCellOptions },
        { text: String(row.year2 || ''), options: rowCellOptions },
        { text: String(row.year3 || ''), options: rowCellOptions },
        { text: String(row.year4 || ''), options: rowCellOptions },
        { text: String(row.year5 || ''), options: rowCellOptions },
      ]);
    });

    const table3totals = this.calculateTotals(financialProjections);
    table3Rows.push([
      {
        text: 'Total',
        options: {
          align: 'center' as const,
          valign: 'middle' as const,
          color: '#1B2341',
          fontFace: 'Helvetica 1',
          fontSize: 16.5,
          bold: true,
        },
      },
      { text: table3totals.year1, options: rowCellOptions },
      { text: table3totals.year2, options: rowCellOptions },
      { text: table3totals.year3, options: rowCellOptions },
      { text: table3totals.year4, options: rowCellOptions },
      { text: table3totals.year5, options: rowCellOptions },
    ]);

    slide10.addTable(table3Rows, {
      x: 1.51,
      y: 2,
      border: {
        color: '#000000',
        type: 'solid',
        pt: 1,
      },
      colW: 2.83,
      rowH: 0.6,
    });

    const slide11 = pptx.addSlide();

    slide11.background = { color: '#FFFFFF' };

    slide11.addText('Financial Projections', {
      h: 1.19,
      w: 13.56,
      x: 0.85,
      y: 0.32,
      color: '#1B2341',
      fontFace: 'Helvetica 1',
      bold: true,
      fontSize: 66,
    });

    slide11.addText('Breakeven', {
      h: 0.54,
      w: 1.95,
      x: 0.85,
      y: 1.36,
      color: '#1B2341',
      fontFace: 'Helvetica 1',
      fontSize: 26,
    });

    const table4Rows: TableCell[][] = [];

    table4Rows.push([{ text: 'Month', options: headCellOptions }, ...yearKeys.map((y) => ({ text: y.replace('y', 'Year '), options: headCellOptions }))]);

    const breakeven = pitchDeckData.breakeven[0];

    const table4totals: Record<string, number> = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

    monthKeys.forEach((mKey, idx) => {
      const monthData = breakeven[mKey] || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

      table4totals.y1 += Number(monthData.y1) || 0;
      table4totals.y2 += Number(monthData.y2) || 0;
      table4totals.y3 += Number(monthData.y3) || 0;
      table4totals.y4 += Number(monthData.y4) || 0;
      table4totals.y5 += Number(monthData.y5) || 0;

      table4Rows.push([
        {
          text: months[idx],
          options: rowCellOptions,
        },
        {
          text: String(monthData.y1),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y2),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y3),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y4),
          options: rowCellOptions,
        },
        {
          text: String(monthData.y5),
          options: rowCellOptions,
        },
      ]);
    });

    table4Rows.push([
      {
        text: 'Total',
        options: {
          align: 'center' as const,
          valign: 'middle' as const,
          color: '#000000',
          fontFace: 'Helvetica 2',
          fontSize: 16.5,
          bold: true,
        },
      },
      {
        text: String(table4totals.y1),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y2),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y3),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y4),
        options: rowCellOptions,
      },
      {
        text: String(table4totals.y5),
        options: rowCellOptions,
      },
    ]);

    slide11.addTable(table4Rows, {
      x: 0.85,
      y: 1.9,
      border: {
        color: '#000000',
        type: 'solid',
        pt: 1,
      },
      colW: 2.22,
      rowH: 0.62,
    });

    slide11.addText('BREAK-EVEN POINT', {
      h: 1.01,
      w: 3.91,
      x: 15.36,
      y: 4.2,
      color: '#000000',
      align: 'center',
      fontFace: 'Helvetica 1',
      fontSize: 33,
    });

    slide11.addShape(pptx.ShapeType.rect, {
      h: 0.93,
      w: 3.58,
      x: 15.52,
      y: 5.79,
      fill: '#FDCA40',
    });

    slide11.addText(pitchDeckData.breakevenPoint, {
      h: 0.92,
      w: 3.58,
      x: 15.52,
      y: 5.63,
      align: 'center',
      valign: 'middle',
      color: '#000000',
      fontFace: 'Helvetica 1',
      fontSize: 18,
      bold: true,
    });

    this.addFutureSlides(pptx, pitchDeckData.futurePlans, {
      bgColor: '#FFFFFF',
      title: {
        text: 'Future Developments',
        h: 1.14,
        w: 9.87,
        x: 1.13,
        y: 1.09,
        color: '#1B2341',
        fontFace: 'Helvetica 1',
        bold: true,
        fontSize: 66,
      },
      images: [{ path: 'public/deck-3/slide_11.1.png', h: 3.51, w: 17.75, x: 1.12, y: 2.58 }],
      content: {
        h: 3.67,
        w: 17.73,
        x: 1.14,
        y: 6.71,
        color: '#000000',
        align: 'justify',
        valign: 'top',
        fontFace: 'Helvetica 1',
        fontSize: 23,
      },
      maxCharsPerSlide: 900,
    });

    const slide12 = pptx.addSlide();
    slide12.background = { color: '#FFFFFF' };

    slide12.addShape(pptx.ShapeType.rect, {
      h: 11.25,
      w: 10.96,
      x: 9.04,
      y: 0,
      fill: {
        type: 'solid',
        color: '#F39223',
      },
    });

    slide12.addImage({
      path: path.join(process.cwd(), 'public/deck-3/slide_12.1.jpg'),
      h: 9,
      w: 9.05,
      x: 1.13,
      y: 1.13,
    });

    slide12.addShape(pptx.ShapeType.rect, {
      h: 9,
      w: 8.25,
      x: 10.18,
      y: 1.13,
      fill: {
        type: 'solid',
        color: '#1B2341',
      },
    });

    slide12.addText('Thank You', {
      h: 1.69,
      w: 6.36,
      x: 11.34,
      y: 4.68,
      color: '#FFFFFF',
      fontFace: 'Helvetica 1',
      bold: true,
      fontSize: 90,
      valign: 'top',
      align: 'center',
    });

    slide12.addShape(pptx.ShapeType.ellipse, {
      h: 5.7,
      w: 5.7,
      x: 17.14,
      y: 8.96,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 87 },
    });

    slide12.addShape(pptx.ShapeType.ellipse, {
      h: 10.9,
      w: 10.9,
      x: 14.07,
      y: 6.05,
      rotate: 205,
      fill: {
        type: 'solid',
        color: '#FFFFFF',
        transparency: 99,
      },
      line: { color: '#FFFFFF', width: 1.5, transparency: 83 },
    });
  }

  private addMarkdownSlides(
    pptx: any,
    markdownText: string,
    options: {
      bgColor?: string;
      title?: { text?: string; h: number; w: number; x: number; y: number; color: string; fontFace: string; fontSize: number; bold?: boolean; align?: string };
      images?: { path: string; h: number; w: number; x: number; y: number; sizing?: string }[];
      content?: Record<string, any>;
      shapes?: Record<string, any>[];
      maxWordsPerSlide?: number;
    } = {},
  ) {
    const tokens = marked.lexer(markdownText);

    const contents: string[] = [];

    // Collect content from different token types
    for (const token of tokens) {
      switch (token.type) {
        case 'heading':
        case 'paragraph':
          if ('text' in token) {
            const cleanText = token.text.replace(/\*/g, '').trim();
            contents.push(cleanText + '\n');
          }
          break;

        case 'list':
          if ('items' in token) {
            token.items.forEach((item: any, idx: number) => {
              const line = token.ordered ? `${idx + 1}. ${item.text}` : `• ${item.text}`;
              contents.push(line.replace(/\*/g, '').trim());
            });
          }
          break;

        case 'link':
          if ('href' in token) contents.push(token.href.replace(/\*/g, '').trim());
          break;

        default:
          break;
      }
    }

    // Split content into slides based on word count
    const slidesData: string[] = [];
    const maxWords = options.maxWordsPerSlide || 150; // default 150 words per slide
    let currentSlideText = '';
    let currentWordCount = 0;

    for (const content of contents) {
      const contentWords = content.split(/\s+/).length;

      if (contentWords > maxWords) {
        // Split this content itself into multiple chunks
        const words = content.split(/\s+/);
        for (let i = 0; i < words.length; i += maxWords) {
          const chunk = words.slice(i, i + maxWords).join(' ');
          slidesData.push(chunk);
        }
        currentSlideText = '';
        currentWordCount = 0;
      } else if (currentWordCount + contentWords > maxWords) {
        if (currentSlideText.trim()) slidesData.push(currentSlideText.trim());
        currentSlideText = content;
        currentWordCount = contentWords;
      } else {
        currentSlideText += (currentSlideText ? '\n' : '') + content;
        currentWordCount += contentWords;
      }
    }

    if (currentSlideText.trim()) slidesData.push(currentSlideText.trim());

    // Create PPT slides
    slidesData.forEach((data) => {
      const slide = pptx.addSlide();
      slide.background = { color: options.bgColor || '#FFFFFF' };

      // Add images if provided
      options.images?.forEach((img) => {
        slide.addImage({
          path: img.path,
          x: img.x,
          y: img.y,
          w: img.w,
          h: img.h,
          sizing: img.sizing,
        });
      });

      options.shapes?.forEach((shape) => {
        slide.addShape(shape.type, {
          h: shape.h,
          w: shape.w,
          x: shape.x,
          y: shape.y,
          rotate: shape.rotate,
          fill: shape.fill,
          line: shape.line,
        });
      });

      // Add slide title
      if (options.title?.text) {
        slide.addText(options.title.text, {
          ...options.title,
          text: undefined,
          fontFace: options.title?.fontFace ?? 'Arial',
          fontSize: options.title?.fontSize ?? 42,
        });
      }

      // Add slide content
      slide.addText(data, {
        ...options.content,
        align: 'justify',
        valign: 'top',
        autoFit: true,
        fit: true,
        fontFace: options.content?.fontFace ?? 'Arial',
        fontSize: options.content?.fontSize ?? 20,
        margin: 0.3,
      });
    });
  }

  private addFutureSlides(
    pptx: any,
    markdownText: string,
    options: {
      bgColor?: string;
      title?: {
        text?: string;
        h: number;
        w: number;
        x: number;
        y: number;
        color: string;
        fontFace: string;
        bold?: boolean;
        fontSize: number;
      };
      images?: { path: string; h: number; w: number; x: number; y: number }[];
      content?: Record<string, any>;
      maxCharsPerSlide?: number; // 🆕 configurable limit
    } = {},
  ) {
    const tokens = marked.lexer(markdownText);
    const paragraphs: string[] = [];

    // Collect paragraphs only
    for (const token of tokens) {
      if (token.type === 'paragraph') {
        paragraphs.push(token.text.trim());
      }
    }

    const slidesData: string[] = [];
    const maxChars = options.maxCharsPerSlide || 800;

    // 🧩 Group paragraphs until maxChars reached
    let currentSlideText = '';
    for (const para of paragraphs) {
      if ((currentSlideText + '\n\n' + para).length > maxChars) {
        slidesData.push(currentSlideText.trim());
        currentSlideText = para;
      } else {
        currentSlideText += (currentSlideText ? '\n\n' : '') + para;
      }
    }
    if (currentSlideText) slidesData.push(currentSlideText.trim());

    // 🖼️ Create slides
    slidesData.forEach((content, idx) => {
      const slide = pptx.addSlide();
      slide.background = { color: options.bgColor || '#FFFFFF' };

      // Optional background images
      options.images?.forEach((img) => {
        slide.addImage({
          path: img.path,
          x: img.x,
          y: img.y,
          w: img.w,
          h: img.h,
        });
      });

      // Title (add only to first slide optionally)
      if (idx === 0) {
        slide.addText(options.title?.text ?? 'FUTURE DEVELOPMENTS', { ...options.title, text: undefined });
      }

      // 📝 Auto-fit text block
      slide.addText(content, {
        ...options.content,
        autoFit: true,
        fit: true,
        valign: 'top',
        margin: 0.3,
        fontSize: options.content?.fontSize ?? 18,
        fontFace: options.content?.fontFace ?? 'Arial',
      });
    });
  }

  private extractOpexData(opexData: Record<string, unknown> | null | undefined): { name: string; cost: number }[] {
    if (!opexData) return [];

    const result: { name: string; cost: number }[] = [];

    const yearMapping: Record<string, string> = {
      y0: 'Capex',
      y1: 'Year 1',
      y2: 'Year 2',
      y3: 'Year 3',
      y4: 'Year 4',
      y5: 'Year 5',
    };

    Object.entries(opexData).forEach(([key, value]) => {
      if (yearMapping[key] && typeof value === 'number') {
        result.push({ name: yearMapping[key], cost: value });
      }
    });

    return result;
  }

  private constructFinancialProjections(data: any): any {
    if (!data.sales || !data.sales[0]) return null;

    const projections: any[] = [];
    const months = data.sales[0];

    for (let m = 1; m <= 12; m++) {
      const monthKey = `M${m}`;
      if (months[monthKey]) {
        const monthData = months[monthKey];
        projections.push({
          metric: monthKey,
          year1: monthData.y1 !== undefined && monthData.y1 !== null ? String(monthData.y1) : '-',
          year2: monthData.y2 !== undefined && monthData.y2 !== null ? String(monthData.y2) : '-',
          year3: monthData.y3 !== undefined && monthData.y3 !== null ? String(monthData.y3) : '-',
          year4: monthData.y4 !== undefined && monthData.y4 !== null ? String(monthData.y4) : '-',
          year5: monthData.y5 !== undefined && monthData.y5 !== null ? String(monthData.y5) : '-',
        });
      }
    }

    return projections.length > 0 ? projections : null;
  }

  private calculateTotals(data: any[]): any {
    const totals = { year1: '-', year2: '-', year3: '-', year4: '-', year5: '-' };
    for (let year = 1; year <= 5; year++) {
      let sum = 0;
      data.forEach((row) => {
        const value = row[`year${year}`];
        if (value && value !== '-') {
          const numValue = parseFloat(String(value));
          if (!isNaN(numValue)) sum += numValue;
        }
      });
      if (sum > 0) totals[`year${year}`] = String(sum);
    }
    return totals;
  }
}
