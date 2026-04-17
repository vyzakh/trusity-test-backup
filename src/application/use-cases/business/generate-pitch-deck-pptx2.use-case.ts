import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { BusinessRepository } from '@infrastructure/database';
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@shared/execeptions';
import * as fs from 'fs';
import * as path from 'path';
const PptxGenJS = require('pptxgenjs');

interface SlideContent {
  title: string;
  content?: string;
  slideType: 'title' | 'image-text' | 'table' | 'content';
  tableData?: any;
}

interface SlideTemplate {
  type: string;
  props: any;
}

//using both choose template 1 or 2
@Injectable()
export class GeneratePitchDec12PPTXUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
      s3Service: S3Service;
    },
  ) {}

  async execute(businessId: any, generatePdf: boolean, templateId: number = 1, user: ICurrentUser): Promise<string> {
    const { businessRepo, s3Service } = this.dependencies;
    const pitchDeckData = await businessRepo.getBusiness({
      businessId: businessId,
    });
    // console.dir(pitchDeckData, { depth: null });

    const studentName = user.name || 'Student';

    if (!pitchDeckData) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Validate templateId
    if (![1, 2].includes(templateId)) {
      throw new NotFoundException('Invalid templateId. Use 1 for gray template or 2 for yellow template');
    }

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Trusity';
    pptx.company = 'Trusity Inc.';
    pptx.subject = 'Pitch Deck';
    pptx.title = `${pitchDeckData?.businessName || 'Business'} - Pitch Deck`;

    // Build slides based on template
    const slideTemplates = templateId === 1 ? this.buildSlideTemplatesTemplate1(pitchDeckData, studentName) : this.buildSlideTemplatesTemplate2(pitchDeckData, studentName);

    // Render each slide based on template
    slideTemplates.forEach((template) => {
      if (templateId === 1) {
        this.renderSlideTemplate1(pptx, template);
      } else {
        this.renderSlideTemplate2(pptx, template);
      }
    });

    const outputDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const uniqueFileName = this.generateUniqueFileName(pitchDeckData?.businessName || 'Pitch');
    const displayFileName = `${pitchDeckData?.businessName || 'Pitch'}_Deck`;
    const pptxPath = path.join(outputDir, `${uniqueFileName}.pptx`);

    await pptx.writeFile({ fileName: pptxPath });
    //console.log('PPTX created:', pptxPath);

    // Convert to PDF if requested
    if (generatePdf) {
      try {
        const pdfPath = await this.convertToPdfWithPuppeteer(slideTemplates, uniqueFileName, outputDir, pitchDeckData, templateId);
        // console.log('PDF created:', pdfPath);
        //console.log('data', pitchDeckData.marketingFeedback);

        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfUploadResult = await s3Service.uploadFile({
          key: `pitch-decks/${businessId}/${uniqueFileName}.pdf`,
          body: pdfBuffer,
          contentType: 'application/pdf',
          acl: 'private',
        });

        const pdfDownloadResult = await s3Service.generateS3DownloadUrl({
          key: `pitch-decks/${businessId}/${uniqueFileName}.pdf`,
          expiresIn: 604800,
          fileName: `${displayFileName}.pdf`,
        });

        // console.log('PDF uploaded to S3:', pdfUploadResult.fileUrl);
        //console.log('PDF download URL:', pdfDownloadResult.downloadUrl);

        fs.unlinkSync(pdfPath);
        return pdfDownloadResult.downloadUrl;
      } catch (error) {
        console.error('PDF generation/upload failed:', error);
      }
    }

    // Upload PPTX to S3
    try {
      const fileBuffer = fs.readFileSync(pptxPath);
      const uploadResult = await s3Service.uploadFile({
        key: `pitch-decks/${businessId}/${uniqueFileName}.pptx`,
        body: fileBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        acl: 'private',
      });

      const downloadResult = await s3Service.generateS3DownloadUrl({
        key: `pitch-decks/${businessId}/${uniqueFileName}.pptx`,
        expiresIn: 604800,
        fileName: `${displayFileName}.pptx`,
      });

      //console.log('PPTX uploaded to S3:', uploadResult.fileUrl);
      //console.log('PPTX download URL:', downloadResult.downloadUrl);

      fs.unlinkSync(pptxPath);
      return downloadResult.downloadUrl;
    } catch (error) {
      console.error('S3 upload failed for PPTX:', error);
      throw new Error('Failed to upload PPTX to S3');
    }
  }

  private generateUniqueFileName(baseName: string): string {
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    return `${cleanBaseName}_${timestamp}`;
  }

  private async imageToBase64(imagePath: string): Promise<string | null> {
    try {
      if (!fs.existsSync(imagePath)) {
        console.warn(`Image not found: ${imagePath}`);
        return null;
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const ext = path.extname(imagePath).toLowerCase();

      const fileSizeInMB = imageBuffer.length / (1024 * 1024);
      if (fileSizeInMB > 2) {
        console.warn(`Large image detected (${fileSizeInMB.toFixed(2)}MB): ${imagePath}`);
      }

      let mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';

      const base64 = imageBuffer.toString('base64');
      //console.log(`Converted ${path.basename(imagePath)} to base64`);
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error(`Error converting image to base64: ${imagePath}`, error);
      return null;
    }
  }

  private async convertToPdfWithPuppeteer(slideTemplates: SlideTemplate[], fileName: string, outputDir: string, data: any, templateId: number): Promise<string> {
    const puppeteer = require('puppeteer');
    const pdfPath = path.join(outputDir, `${fileName}.pdf`);

    //console.log('Converting images to base64...');
    const templatesWithBase64Images = await Promise.all(
      slideTemplates.map(async (template) => {
        if (template.type === 'image-text' && template.props.image) {
          const base64Image = await this.imageToBase64(template.props.image);
          if (base64Image) {
            //console.log(`Successfully converted: ${template.props.image}`);
          }
          return {
            ...template,
            props: {
              ...template.props,
              image: base64Image || template.props.image,
            },
          };
        }
        return template;
      }),
    );

    const htmlContent = templateId === 1 ? this.generateSlidesHTMLTemplate1(templatesWithBase64Images, data) : this.generateSlidesHTMLTemplate2(templatesWithBase64Images, data);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      await page.setContent(htmlContent, {
        waitUntil: 'load',
        timeout: 60000,
      });

      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve);
              setTimeout(resolve, 5000);
            });
          }),
        );
      });

      // console.log('All images loaded, generating PDF...');

      await page.pdf({
        path: pdfPath,
        width: '1920px',
        height: '1080px',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        timeout: 60000,
      });

      console.log('PDF generated successfully');
      return pdfPath;
    } catch (error) {
      console.error('Puppeteer error:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  // ==================== TEMPLATE 1 (GRAY/BEIGE) ====================

  private buildSlideTemplatesTemplate1(data: any, studentName: string): SlideTemplate[] {
    const templates: SlideTemplate[] = [];

    templates.push({
      type: 'title',
      props: {
        title: 'PITCH DECK',
        subtitle: `PRESENTED BY: ${studentName}`,
      },
    });

    const outputDir = path.join(process.cwd(), 'public');

    // //   const sections = [
    // //   { title: 'PROBLEM', content: data.problemStatement, image: 'image_1.png' },
    // //   { title: 'SOLUTION', content: data.idea, image: 'image_2.png' },
    // //   { title: 'PROTOTYPE', content: data.prototypeDescription, image: 'image_3.png' },
    // //   { title: 'MARKET COMPETITION', content: data.marketCompetitors, image: 'image_5.png' },
    // //   { title: 'MARKETING STRATEGY', content: data.marketing, image: 'image_6.png' },
    // //   { title: 'REVENUE MODEL', content: this.formatRevenueModel(data.revenueModel), image: 'image_7.png' },
    // // ];

    //   const sections = [
    //     { title: 'PROBLEM', content: data.problemStatement, image: path.join(outputDir, 'image_1.png') },
    //     { title: 'SOLUTION', content: data.idea, image: path.join(outputDir, 'image_2.png') },
    //     { title: 'PROTOTYPE', content: data.prototypeDescription, image: path.join(outputDir, 'image_3.png') },
    //     { title: 'MARKET COMPETITION', content: data.marketCompetitors, image: path.join(outputDir, 'image_5.png') },
    //     { title: 'MARKETING STRATEGY', content: data.marketing, image: path.join(outputDir, 'image_6.png') },
    //     { title: 'REVENUE MODEL', content: this.formatRevenueModel(data.revenueModel), image: path.join(outputDir, 'image_7.png') },
    //   ];

    //   sections.forEach(section => {
    //     if (section.content) {
    //       const cleanContent = this.stripMarkdown(this.safeText(section.content));
    //       const chunks = this.splitTextIntoChunks(cleanContent, 350);
    //       chunks.forEach((chunk) => {
    //         templates.push({
    //           type: 'image-text',
    //           props: {
    //             title: section.title,
    //             content: chunk,
    //             image: section.image
    //           // image: `https://trusity-dev-api.zoftcares.com/public/${section.image}`
    //           }
    //         });
    //       });
    //     }
    //   });

    //   if (data.targetMarket || data.marketFit) {
    //     const content = [
    //       data.targetMarket && `Primary Market: ${data.targetMarket}`,
    //       data.marketFit && `Market Fit: ${data.marketFit}`,
    //     ].filter(Boolean).join('\n\n');

    //     const targetMarketAndMarketFitImage = 'image_5.png';

    //     const cleanContent = this.stripMarkdown(content);
    //     const chunks = this.splitTextIntoChunks(cleanContent, 350);
    //     chunks.forEach((chunk) => {
    //       templates.push({
    //         type: 'image-text',
    //         props: {
    //           title: 'TARGET MARKET & MARKET FIT',
    //           content: chunk,
    //          // image: `https://trusity-dev-api.zoftcares.com/public/${targetMarketAndMarketFitImage}`
    //           image: path.join(outputDir, 'image_5.png')
    //         }
    //       });
    //     });
    //   }

    //   if (data.capex || data.opex) {
    //     const opexExpense = data.opex?.[0]?.opexExpense;
    //     templates.push({
    //       type: 'startup-costs',
    //       props: {
    //         capex: data.capex || [],
    //         opex: this.extractOpexData(opexExpense) || []
    //       }
    //     });
    //   }

    //   const financialProjections = this.constructFinancialProjections(data);
    //   if (financialProjections) {
    //     templates.push({
    //       type: 'financial-projections',
    //       props: { data: financialProjections }
    //     });
    //   }

    //   if (data.futurePlans) {
    //     const cleanContent = this.stripMarkdown(this.safeText(data.futurePlans));
    //     const chunks = this.splitTextIntoChunks(cleanContent, 700);
    //     chunks.forEach((chunk) => {
    //       templates.push({
    //         type: 'content',
    //         props: {
    //           title: 'FUTURE DEVELOPMENTS',
    //           content: chunk
    //         }
    //       });
    //     });
    //   }

    //   templates.push({
    //     type: 'content',
    //     props: {
    //       title: 'THANK YOU',
    //       content: `We'd love to collaborate and bring this vision to life.`
    //     }
    //   });

    //   return templates;
    // with order
    const targetMarketContent = [data.marketResearchData || '', '\n\n Market Fit \n\n', data.marketFit || ''].filter((text) => text && text.trim()).join('');
    const sections = [
      {
        title: 'PROBLEM',
        content: data.problemStatement,
        image: path.join(outputDir, 'image_1.png'),
      },

      {
        title: 'SOLUTION',
        content: data.idea,
        image: path.join(outputDir, 'image_2.png'),
      },

      {
        title: 'PROTOTYPE',
        content: data.prototypeDescription,
        image: path.join(outputDir, 'image_3.png'),
      },

      {
        title: 'TARGET MARKET & MARKET FIT',
        content: targetMarketContent,
        image: path.join(outputDir, 'image_5.png'),
      },

      {
        title: 'MARKETING STRATEGY',
        content: data.marketingFeedback,
        image: path.join(outputDir, 'image_6.png'),
      },

      {
        title: 'MARKET COMPETITION',
        content: data.marketCompetitors,
        image: path.join(outputDir, 'image_5.png'), // same as competition image
      },

      {
        title: 'REVENUE MODEL',
        content: this.formatRevenueModel(data.revenueModel),
        image: path.join(outputDir, 'image_7.png'),
      },
    ];

    // Push sections into templates
    sections.forEach((section) => {
      if (section.content) {
        const cleanContent = this.stripMarkdown(this.safeText(section.content));
        const chunks = this.splitTextIntoChunks(cleanContent, 1000);
        chunks.forEach((chunk) => {
          templates.push({
            type: 'image-text',
            props: {
              title: section.title,
              content: chunk,
              image: section.image,
            },
          });
        });
      }
    });

    if (data.capex || data.opex) {
      const opexExpense = data.opex?.[0]?.opexExpense;
      //console.log('Full data:', JSON.stringify(data, null, 2));
      templates.push({
        type: 'startup-costs',
        props: {
          capex: data.capex || [],
          opex: this.extractOpexData(opexExpense) || [],
          monthlyOpex: data.opex?.[0],
        },
      });
    }
    const financialProjections = this.constructFinancialProjections(data);
    if (financialProjections) {
      templates.push({
        type: 'financial-projections',
        props: { data: financialProjections },
      });
    }
    // **ADD THIS: Break-Even slide**
    if (data.breakeven && data.breakeven.length > 0) {
      templates.push({
        type: 'break-even',
        props: { data: data.breakeven[0], breakevenPoint: data.breakevenPoint },
      });
    }

    if (data.futurePlans) {
      const cleanContent = this.stripMarkdown(this.safeText(data.futurePlans));
      const chunks = this.splitTextIntoChunks(cleanContent, 1000);
      chunks.forEach((chunk) => {
        templates.push({
          type: 'content',
          props: {
            title: 'FUTURE DEVELOPMENTS',
            content: chunk,
          },
        });
      });
    }

    templates.push({
      type: 'content',
      props: {
        title: 'THANK YOU',
        content: `We'd love to collaborate and bring this vision to life.`,
      },
    });

    return templates;
  }

  private renderSlideTemplate1(pptx: any, template: SlideTemplate): void {
    const slide = pptx.addSlide();
    slide.background = { fill: 'E8E8E3' };

    switch (template.type) {
      case 'title':
        slide.addText(template.props.subtitle, {
          x: 0.5,
          y: 0.5,
          fontSize: 14,
          color: '2D2D2D',
          fontFace: 'Arial',
        });
        slide.addText('PITCH\nDECK', {
          x: 5.5,
          y: 3.5,
          w: 4.0,
          h: 2.5,
          fontSize: 60,
          bold: true,
          color: '2D2D2D',
          fontFace: 'Arial',
          align: 'right',
          lineSpacing: 50,
        });
        break;

      case 'image-text':
        // Split content intelligently at 700 chars
        const imageTextChunks = template.props.content ? this.splitTextIntoChunks(template.props.content, 700) : [''];

        imageTextChunks.forEach((chunk, index) => {
          const slideForChunk = index === 0 ? slide : pptx.addSlide();
          slideForChunk.bkgd = 'E8E8E3';

          // Same title on all slides
          slideForChunk.addText(template.props.title.toUpperCase(), {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.6,
            fontSize: 40,
            bold: true,
            color: '2D2D2D',
            fontFace: 'Arial',
          });

          // Same image on all slides
          if (template.props.image) {
            try {
              slideForChunk.addImage({
                path: template.props.image,
                x: 0.5,
                y: 1.2,
                w: 3.5,
                h: 3.5,
                sizing: { type: 'cover', w: 3.5, h: 3.5 },
              });
            } catch (error) {
              console.error('Error adding image:', error);
              slideForChunk.addShape(slideForChunk.constructor.ShapeType?.rect || 'rect', {
                x: 0.5,
                y: 1.2,
                w: 3.5,
                h: 3.5,
                fill: { color: '4A90E2' },
              });
            }
          }

          // Add content chunk - CONSISTENT FONT SIZE
          if (chunk) {
            slideForChunk.addText(chunk, {
              x: 4.5,
              y: 1.2,
              w: 5.0,
              h: 4.3,
              fontSize: 11, // Consistent across all slides
              color: '2D2D2D',
              lineSpacing: 16,
              fontFace: 'Arial',
              valign: 'top',
              align: 'left',
              breakLine: true,
              wrap: true,
            });
          }
        });
        break;

      case 'content':
        // Split content intelligently at 700 chars
        const contentChunks = template.props.content ? this.splitTextIntoChunks(template.props.content, 700) : [''];

        contentChunks.forEach((chunk, index) => {
          const slideForChunk = index === 0 ? slide : pptx.addSlide();
          slideForChunk.bkgd = 'E8E8E3';

          // Same title on all slides
          slideForChunk.addText(template.props.title.toUpperCase(), {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.6,
            fontSize: 40,
            bold: true,
            color: '2D2D2D',
            fontFace: 'Arial',
          });

          // Add content chunk - CONSISTENT FONT SIZE
          if (chunk) {
            slideForChunk.addText(chunk, {
              x: 0.5,
              y: 1.2,
              w: 9,
              h: 4.3,
              fontSize: 11, // Consistent across all slides
              color: '2D2D2D',
              lineSpacing: 16,
              fontFace: 'Arial',
              valign: 'top',
              align: 'left',
              breakLine: true,
              wrap: true,
            });
          }
        });
        break;

      case 'startup-costs':
        slide.addText('STARTUP COSTS', {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.6,
          fontSize: 40,
          bold: true,
          color: '2D2D2D',
          fontFace: 'Arial',
        });
        this.addTableTemplate1(slide, 'CAPEX', template.props.capex || [], 0.5);
        this.addTableTemplate1(slide, 'OPEX', template.props.opex || [], 5.3);
        //console.log(template.props.monthlyOpex, 'mo');

        if (template.props.monthlyOpex && template.props.monthlyOpex.opex) {
          const monthlySlide = pptx.addSlide();
          // **CHANGED: Use bkgd instead of background**
          monthlySlide.bkgd = 'E8E8E3';
          monthlySlide.addText('STARTUP COSTS', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 40, bold: true, color: '2D2D2D', fontFace: 'Arial' });
          this.addMonthlyOpexTableTemplate1(monthlySlide, template.props.monthlyOpex.opex);
        }
        break;

      case 'financial-projections':
        this.renderFinancialProjectionsTemplate1(slide, template.props);
        break;
      case 'break-even':
        this.renderBreakEvenTemplate1(slide, template.props);
        break;
    }
  }

  private renderBreakEvenTemplate1(slide: any, props: any): void {
    slide.addText('FINANCIAL PROJECTIONS', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 40, bold: true, color: '2D2D2D', fontFace: 'Arial' });

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthKeys = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

    const rows: any[] = [
      [
        {
          text: 'Month',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 1',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 2',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 3',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 4',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 5',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
      ],
    ];

    const totals = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

    monthKeys.forEach((mKey, idx) => {
      const monthData = props.data[mKey] || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

      totals.y1 += Number(monthData.y1) || 0;
      totals.y2 += Number(monthData.y2) || 0;
      totals.y3 += Number(monthData.y3) || 0;
      totals.y4 += Number(monthData.y4) || 0;
      totals.y5 += Number(monthData.y5) || 0;

      rows.push([
        {
          text: months[idx],
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'left',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y1),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y2),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y3),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y4),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y5),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
      ]);
    });

    rows.push([
      {
        text: 'Total',
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'right',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y1),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y2),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y3),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y4),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y5),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
    ]);

    // **CHANGED: Reduced table width to make more room for box**
    slide.addTable(rows, { x: 0.5, y: 1.1, w: 6.5, colW: [1.08, 1.08, 1.08, 1.08, 1.08, 1.08], rowH: 0.28 });

    // **CHANGED: Much wider box with better spacing**
    const breakevenPoint = props.breakevenPoint || 'Year 1, month 3';

    // Title text
    slide.addText('BREAK-EVEN\nPOINT', {
      x: 7.3,
      y: 2.2,
      w: 2.5,
      h: 0.6,
      fontSize: 18,
      bold: true,
      color: '2D2D2D',
      align: 'center',
      fontFace: 'Arial',
    });

    // **CHANGED: Much wider rectangle box**
    slide.addShape('rect', {
      x: 7.3,
      y: 3.0,
      w: 2.5,
      h: 1.2,
      fill: { color: '2D2D2D' },
    });

    // **CHANGED: Better text spacing with larger font**
    slide.addText(breakevenPoint, {
      x: 7.3,
      y: 3.0,
      w: 2.5,
      h: 1.2,
      fontSize: 20,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      fontFace: 'Arial',
    });
  }

  private addMonthlyOpexTableTemplate1(slide: any, opexData: any): void {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthKeys = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

    // Header row - 0.5pt borders
    const rows: any[] = [
      [
        {
          text: 'Month',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 1',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 2',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 3',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 4',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: 'Year 5',
          options: {
            fill: { color: 'FFFFFF' },
            bold: true,
            fontSize: 12,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
      ],
    ];

    const totals = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

    monthKeys.forEach((mKey, idx) => {
      const monthData = opexData[mKey] || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };

      totals.y1 += Number(monthData.y1) || 0;
      totals.y2 += Number(monthData.y2) || 0;
      totals.y3 += Number(monthData.y3) || 0;
      totals.y4 += Number(monthData.y4) || 0;
      totals.y5 += Number(monthData.y5) || 0;

      rows.push([
        {
          text: months[idx],
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'left',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y1),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y2),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y3),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y4),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
        {
          text: String(monthData.y5),
          options: {
            fill: { color: 'E8E8E3' },
            fontSize: 11,
            align: 'center',
            border: [
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
              { pt: 0.5, color: '000000' },
            ],
          },
        },
      ]);
    });

    rows.push([
      {
        text: 'Total OPEX',
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'right',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y1),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y2),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y3),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y4),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
      {
        text: String(totals.y5),
        options: {
          fill: { color: 'E8E8E3' },
          fontSize: 11,
          align: 'center',
          bold: true,
          border: [
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
            { pt: 0.5, color: '000000' },
          ],
        },
      },
    ]);

    slide.addTable(rows, { x: 0.5, y: 1.1, w: 9, colW: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5], rowH: 0.28 });
  }

  private addTableTemplate1(slide: any, title: string, data: any[], x: number): void {
    const rows: any[] = [
      [
        { text: title, options: { fill: { color: 'FFFFFF' }, bold: true, fontSize: 14, align: 'center', border: { pt: 1, color: '2D2D2D' } } },
        { text: 'COSTS', options: { fill: { color: 'FFFFFF' }, bold: true, fontSize: 14, align: 'center', border: { pt: 1, color: '2D2D2D' } } },
      ],
    ];

    data.slice(0, 10).forEach((item) => {
      rows.push([
        { text: String(item.name || Object.keys(item)[0] || ''), options: { fontSize: 12, align: 'left', border: { pt: 1, color: 'CCCCCC' } } },
        { text: String(item.cost || Object.values(item)[0] || ''), options: { fontSize: 12, align: 'center', border: { pt: 1, color: 'CCCCCC' } } },
      ]);
    });

    slide.addTable(rows, { x, y: 1.3, w: 4.2, colW: [2.5, 1.7], rowH: 0.4 });
  }

  private renderFinancialProjectionsTemplate1(slide: any, props: any): void {
    slide.addText('FINANCIAL PROJECTIONS', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 40,
      bold: true,
      color: '2D2D2D',
      fontFace: 'Arial',
    });

    const data = Array.isArray(props.data) ? props.data : [];
    const rows: any[] = [
      [
        { text: 'Sales Units', options: { fill: { color: 'FFFFFF' }, bold: true, fontSize: 11, align: 'center', border: { pt: 1, color: '2D2D2D' } } },
        { text: 'Year 1', options: { fill: { color: 'FFFFFF' }, bold: true, fontSize: 11, align: 'center', border: { pt: 1, color: '2D2D2D' } } },
        { text: 'Year 2', options: { fill: { color: 'FFFFFF' }, bold: true, fontSize: 11, align: 'center', border: { pt: 1, color: '2D2D2D' } } },
        { text: 'Year 3', options: { fill: { color: 'FFFFFF' }, bold: true, fontSize: 11, align: 'center', border: { pt: 1, color: '2D2D2D' } } },
        { text: 'Year 4', options: { fill: { color: 'FFFFFF' }, bold: true, fontSize: 11, align: 'center', border: { pt: 1, color: '2D2D2D' } } },
        { text: 'Year 5', options: { fill: { color: 'FFFFFF' }, bold: true, fontSize: 11, align: 'center', border: { pt: 1, color: '2D2D2D' } } },
      ],
    ];

    data.forEach((row) => {
      rows.push([
        { text: String(row.metric || ''), options: { fontSize: 10, align: 'left', border: { pt: 1, color: 'CCCCCC' } } },
        { text: String(row.year1 || ''), options: { fontSize: 10, align: 'center', border: { pt: 1, color: 'CCCCCC' } } },
        { text: String(row.year2 || ''), options: { fontSize: 10, align: 'center', border: { pt: 1, color: 'CCCCCC' } } },
        { text: String(row.year3 || ''), options: { fontSize: 10, align: 'center', border: { pt: 1, color: 'CCCCCC' } } },
        { text: String(row.year4 || ''), options: { fontSize: 10, align: 'center', border: { pt: 1, color: 'CCCCCC' } } },
        { text: String(row.year5 || ''), options: { fontSize: 10, align: 'center', border: { pt: 1, color: 'CCCCCC' } } },
      ]);
    });

    const totals = this.calculateTotals(data);
    rows.push([
      { text: 'Total', options: { fontSize: 10, align: 'right', bold: true, border: { pt: 1, color: 'CCCCCC' } } },
      { text: totals.year1, options: { fontSize: 10, align: 'center', bold: true, border: { pt: 1, color: 'CCCCCC' } } },
      { text: totals.year2, options: { fontSize: 10, align: 'center', bold: true, border: { pt: 1, color: 'CCCCCC' } } },
      { text: totals.year3, options: { fontSize: 10, align: 'center', bold: true, border: { pt: 1, color: 'CCCCCC' } } },
      { text: totals.year4, options: { fontSize: 10, align: 'center', bold: true, border: { pt: 1, color: 'CCCCCC' } } },
      { text: totals.year5, options: { fontSize: 10, align: 'center', bold: true, border: { pt: 1, color: 'CCCCCC' } } },
    ]);

    slide.addTable(rows, { x: 0.5, y: 1.1, w: 9, colW: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5], rowH: 0.28 });

    // slide.addText('BREAK-EVEN POINT', {
    //   x: 7.8,
    //   y: 2.2,
    //   w: 2.0,
    //   h: 0.4,
    //   fontSize: 13,
    //   bold: true,
    //   color: '2D2D2D',
    //   align: 'center',
    // });

    // slide.addShape(slide.constructor.ShapeType?.rect || 'rect', {
    //   x: 7.8,
    //   y: 2.7,
    //   w: 2.0,
    //   h: 0.55,
    //   fill: { color: '2D2D2D' },
    // });

    // slide.addText('Year 1, month 3', {
    //   x: 7.8,
    //   y: 2.7,
    //   w: 2.0,
    //   h: 0.55,
    //   fontSize: 15,
    //   bold: true,
    //   color: 'FFFFFF',
    //   align: 'center',
    //   valign: 'middle',
    // });
  }

  private generateSlidesHTMLTemplate1(slideTemplates: SlideTemplate[], data: any): string {
    //console.log(data.opex, 'data');

    const slides = slideTemplates
      .map((template, index) => {
        return this.generateSlideHTMLTemplate1(template, index, data);
      })
      .join('\n');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Pitch Deck</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #E8E8E3; }
          .slide {
            width: 1920px; height: 1080px; background: #E8E8E3;
            page-break-after: always; page-break-inside: avoid;
            position: relative; padding: 50px 80px;
            display: flex; flex-direction: column;
          }
          .slide:last-child { page-break-after: auto; }
          .title-slide { justify-content: space-between; }
          .title-slide .subtitle { font-size: 28px; color: #2D2D2D; margin-bottom: 20px; }
          .title-slide .main-title {
            text-align: right; font-size: 120px; font-weight: bold;
            color: #2D2D2D; line-height: 1.1; margin-bottom: 150px;
          }
          .content-slide .slide-title {
            font-size: 70px; font-weight: bold; color: #2D2D2D;
            margin-bottom: 35px; flex-shrink: 0;
          }
          .image-text-layout { display: flex; gap: 50px; flex: 1; align-items: flex-start; overflow: hidden; }
          .image-container {
            width: 650px; height: 650px; display: flex;
            align-items: center; justify-content: center;
            flex-shrink: 0; border-radius: 8px; overflow: hidden;
          }
          .image-container img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
          .text-content {
            flex: 1; font-size: 26px; color: #2D2D2D;
            line-height: 1.6; overflow: hidden;
            display: flex; flex-direction: column; justify-content: flex-start;
          }
          .text-content p { margin-bottom: 15px; }
          .full-text-content {
            flex: 1; font-size: 30px; color: #2D2D2D;
            line-height: 1.7; overflow: hidden;
          }
          .full-text-content p { margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 30px; font-size: 22px; }
          th, td { border: 2px solid #2D2D2D; padding: 15px 20px; text-align: center; }
          th { background: #FFFFFF; font-weight: bold; font-size: 24px; }
          td { background: #FFFFFF; }
          .financial-tables { display: flex; gap: 40px; margin-top: 30px; flex: 1; }
          .financial-tables table { flex: 1; margin-top: 0; }
          .financial-projection-container { display: flex; gap: 40px; flex: 1; margin-top: 30px; }
          .projection-table-wrapper { flex: 1; }
          .projection-table-wrapper table { margin-top: 0; font-size: 18px; }
          .projection-table-wrapper th, .projection-table-wrapper td { padding: 10px 12px; }
          .break-even {
            width: 320px; flex-shrink: 0; display: flex;
            flex-direction: column; justify-content: center; align-items: center;
          }
          .break-even-title {
            font-size: 24px; font-weight: bold; color: #2D2D2D;
            margin-bottom: 20px; text-align: center;
          }
          .break-even-box {
            background: #2D2D2D; color: #FFFFFF; padding: 30px 35px;
            font-size: 28px; font-weight: bold; text-align: center;
            border-radius: 8px; width: 100%;
          }
           .financial-tables-with-opex {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  height: calc(100% - 100px);
}

.summary-tables {
  flex: 0 0 auto;
  width: 380px;  /* Reduced from 450px */
  display: flex;
  flex-direction: column;
  gap: 20px;  /* Reduced gap */
}

.summary-tables table {
  width: 100%;
  font-size: 13px;  /* Slightly smaller font */
}

.opex-details {
  flex: 1;
  min-width: 0;
  padding-left: 10px;
}
  .table-subtitle {
  font-size: 32px;
  font-weight: 600;
  color: #2D2D2D;
  margin-bottom: 15px;
  margin-top: -15px;
}

.opex-details table {
  font-size: 13px;  /* Reduced from 14px */
}       </style>
      </head>
      <body>${slides}</body>
      </html>
    `;
  }

  private generateSlideHTMLTemplate1(template: SlideTemplate, index: number, data: any): string {
    const isBase64 = template.props.image && template.props.image.startsWith('data:');
    //console.log('temp', template);

    switch (template.type) {
      case 'title':
        return `
          <div class="slide title-slide">
            <div class="subtitle">${template.props.subtitle}</div>
            <div class="main-title">PITCH<br>DECK</div>
          </div>
        `;

      case 'image-text':
        return `
          <div class="slide content-slide">
            <div class="slide-title">${template.props.title}</div>
            <div class="image-text-layout">
              <div class="image-container">
                ${
                  template.props.image && isBase64
                    ? `<img src="${template.props.image}" alt="Slide image">`
                    : '<div style="color: white; font-size: 32px; font-weight: bold;">Visual</div>'
                }
              </div>
              <div class="text-content">${this.formatTextWithParagraphs(template.props.content || '')}</div>
            </div>
          </div>
        `;

      case 'content':
        return `
          <div class="slide content-slide">
            <div class="slide-title">${template.props.title}</div>
            <div class="full-text-content">${this.formatTextWithParagraphs(template.props.content || '')}</div>
          </div>
        `;

      case 'startup-costs':
        return `
          <div class="slide content-slide">
            <div class="slide-title">STARTUP COSTS</div>
            <div class="financial-tables">
              ${this.generateTableHTMLTemplate1('CAPEX', template.props.capex)}
              ${this.generateTableHTMLTemplate1('OPEX', template.props.opex)}
            </div>
           ${this.generateMonthlyOpexTableTemplate1(data.opex?.[0]?.opex)}
          </div>
        `;

      case 'financial-projections':
        return this.generateFinancialProjectionHTMLTemplate1(template.props.data);

      case 'break-even':
        return `
    <div class="slide content-slide">
      <div class="slide-title">FINANCIAL PROJECTIONS</div>
      ${this.generateBreakEvenHTMLTemplate(template.props.data)}
    </div>
  `;

      default:
        return '';
    }
  }
  private generateMonthlyOpexTableTemplate1(opexData: any): string {
    if (!opexData) return '';

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthKeys = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

    // Calculate totals
    const totals = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };
    monthKeys.forEach((mKey) => {
      if (opexData[mKey]) {
        totals.y1 += Number(opexData[mKey].y1) || 0;
        totals.y2 += Number(opexData[mKey].y2) || 0;
        totals.y3 += Number(opexData[mKey].y3) || 0;
        totals.y4 += Number(opexData[mKey].y4) || 0;
        totals.y5 += Number(opexData[mKey].y5) || 0;
      }
    });

    const rows = monthKeys
      .map((mKey, idx) => {
        const monthData = opexData[mKey] || { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };
        return `
      <tr>
        <td style="text-align: left;font-size: 14px; padding: 8px 10px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;font-weight: 600;">${months[idx]}</td>
        <td style="text-align: center;font-size: 14px; padding: 8px 10px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;font-weight: 600;">${monthData.y1}</td>
        <td style="text-align: center; font-size: 14px;padding: 8px 10px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;font-weight: 600;">${monthData.y2}</td>
        <td style="text-align: center; font-size: 14px;padding: 8px 10px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;font-weight: 600;">${monthData.y3}</td>
        <td style="text-align: center; font-size: 14px;padding: 8px 10px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;font-weight: 600;">${monthData.y4}</td>
        <td style="text-align: center;font-size: 14px; padding: 8px 10px; border-bottom: 1px solid #000000;font-weight: 600;">${monthData.y5}</td>
      </tr>
    `;
      })
      .join('');

    return `
    <div class="opex-details">
      <table style="width: 100%; border-collapse: collapse; background: white; border: 2px solid #000000;">
        <thead>
          <tr style="background: #E8E8E8;">
            <th style="padding: 10px; text-align: left; font-weight: 700; border-right: 1px solid #000000; border-bottom: 1px solid #000000; color: #000000;">Month</th>
            <th style="padding: 10px; text-align: center; font-weight: 700; border-right: 1px solid #000000; border-bottom: 1px solid #000000; color: #000000;">Year 1</th>
            <th style="padding: 10px; text-align: center; font-weight: 700; border-right: 1px solid #000000; border-bottom: 1px solid #000000; color: #000000;">Year 2</th>
            <th style="padding: 10px; text-align: center; font-weight: 700; border-right: 1px solid #000000; border-bottom: 1px solid #000000; color: #000000;">Year 3</th>
            <th style="padding: 10px; text-align: center; font-weight: 700; border-right: 1px solid #000000; border-bottom: 1px solid #000000; color: #000000;">Year 4</th>
            <th style="padding: 10px; text-align: center; font-weight: 700; border-bottom: 1px solid #000000; color: #000000;">Year 5</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr style="background: #f5f5f5; font-weight: 600;">
            <td style="padding: 10px; font-weight: 700; border-right: 1px solid #000000;">Total OPEX</td>
            <td style="padding: 10px; text-align: center; font-weight: 700; border-right: 1px solid #000000;">${totals.y1}</td>
            <td style="padding: 10px; text-align: center; font-weight: 700; border-right: 1px solid #000000;">${totals.y2}</td>
            <td style="padding: 10px; text-align: center; font-weight: 700; border-right: 1px solid #000000;">${totals.y3}</td>
            <td style="padding: 10px; text-align: center; font-weight: 700; border-right: 1px solid #000000;">${totals.y4}</td>
            <td style="padding: 10px; text-align: center; font-weight: 700;">${totals.y5}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  }

  private generateTableHTMLTemplate1(title: string, data: any[]): string {
    const rows = data
      .slice(0, 10)
      .map(
        (item) => `
      <tr>
        <td style="text-align: left; font-weight: 500;">${item.name || Object.keys(item)[0] || ''}</td>
        <td style="font-weight: 600;">${item.cost || Object.values(item)[0] || ''}</td>
      </tr>
    `,
      )
      .join('');

    return `
      <table>
        <thead><tr><th>${title}</th><th>COSTS</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private generateFinancialProjectionHTMLTemplate1(data: any[]): string {
    // Month mapping
    const monthMap = {
      M1: 'January',
      M2: 'February',
      M3: 'March',
      M4: 'April',
      M5: 'May',
      M6: 'June',
      M7: 'July',
      M8: 'August',
      M9: 'September',
      M10: 'October',
      M11: 'November',
      M12: 'December',
    };

    const rows = data
      .map((row) => {
        // Convert M1, M2, etc. to full month names
        const displayMetric = monthMap[row.metric] || row.metric;

        return `
      <tr>
        <td style="text-align: left; font-weight: 600;">${displayMetric}</td>
        <td>${row.year1 || '-'}</td>
        <td>${row.year2 || '-'}</td>
        <td>${row.year3 || '-'}</td>
        <td>${row.year4 || '-'}</td>
        <td>${row.year5 || '-'}</td>
      </tr>
    `;
      })
      .join('');

    const totals = this.calculateTotals(data);

    return `
      <div class="slide content-slide">
        <div class="slide-title">FINANCIAL PROJECTIONS</div>
          <div class="table-subtitle">Sales</div>
        <div class="financial-projection-container">
          <div class="projection-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Sales Units</th><th>Year 1</th><th>Year 2</th>
                  <th>Year 3</th><th>Year 4</th><th>Year 5</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                <tr style="font-weight: bold; background: #F5F5F5;">
                  <td style="text-align: right;">Total</td>
                  <td>${totals.year1}</td><td>${totals.year2}</td>
                  <td>${totals.year3}</td><td>${totals.year4}</td><td>${totals.year5}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
  private generateBreakEvenHTMLTemplate(breakevenData: any): string {
    if (!breakevenData) return '';
    //console.log('brea', breakevenData);

    const monthMap = {
      M1: 'January',
      M2: 'February',
      M3: 'March',
      M4: 'April',
      M5: 'May',
      M6: 'June',
      M7: 'July',
      M8: 'August',
      M9: 'September',
      M10: 'October',
      M11: 'November',
      M12: 'December',
    };

    const monthKeys = Object.keys(monthMap);

    // Calculate totals
    const totals = { y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };
    monthKeys.forEach((mKey) => {
      if (breakevenData[mKey]) {
        totals.y1 += Number(breakevenData[mKey].y1) || 0;
        totals.y2 += Number(breakevenData[mKey].y2) || 0;
        totals.y3 += Number(breakevenData[mKey].y3) || 0;
        totals.y4 += Number(breakevenData[mKey].y4) || 0;
        totals.y5 += Number(breakevenData[mKey].y5) || 0;
      }
    });

    // Build table rows
    const rows = monthKeys
      .map((mKey) => {
        const displayMonth = monthMap[mKey];
        const monthData = breakevenData[mKey] || {};
        return `
        <tr>
          <td style="text-align: left; font-weight: 600;">${displayMonth}</td>
          <td>${monthData.y1 ?? '-'}</td>
          <td>${monthData.y2 ?? '-'}</td>
          <td>${monthData.y3 ?? '-'}</td>
          <td>${monthData.y4 ?? '-'}</td>
          <td>${monthData.y5 ?? '-'}</td>
        </tr>
      `;
      })
      .join('');

    return `
    <div class="slide content-slide">
     <div class="table-subtitle">Break-Even</div>
      <div class="financial-projection-container">
        <div class="projection-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Year 1</th>
                <th>Year 2</th>
                <th>Year 3</th>
                <th>Year 4</th>
                <th>Year 5</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr style="font-weight: bold; background: #F5F5F5;">
                <td style="text-align: right;">Total</td>
                <td>${totals.y1}</td>
                <td>${totals.y2}</td>
                <td>${totals.y3}</td>
                <td>${totals.y4}</td>
                <td>${totals.y5}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  }

  // ==================== TEMPLATE 2 (YELLOW/BLACK) ====================

  private buildSlideTemplatesTemplate2(data: any, studentName: string): SlideTemplate[] {
    const templates: SlideTemplate[] = [];

    templates.push({
      type: 'title',
      props: {
        title: 'PITCH DECK',
        subtitle: `PRESENTED BY: ${studentName}`,
      },
    });

    const outputDir = path.join(process.cwd(), 'public');

    //     const sections = [
    //       { title: 'PROBLEM', content: data.problemStatement, image: path.join(outputDir, 'template_2_image_8.jpg') },
    //       { title: 'SOLUTION', content: data.idea, image: path.join(outputDir, 'template_2_image_9.jpg') },
    //       { title: 'PROTOTYPE', content: data.prototypeDescription },
    //       { title: 'MARKET COMPETITION', content: data.marketCompetitors, image: path.join(outputDir, 'template_2_image_11.jpg') },
    //       { title: 'MARKETING STRATEGY', content: data.marketing, image: path.join(outputDir, 'template_2_image_12.jpg') },
    //       { title: 'REVENUE MODEL', content: this.formatRevenueModel(data.revenueModel), image: path.join(outputDir, 'template_2_image_13.jpg') },
    //     ];

    //     sections.forEach(section => {
    //       if (section.content) {
    //         const cleanContent = this.stripMarkdown(this.safeText(section.content));
    //         const chunks = this.splitTextIntoChunks(cleanContent, 350);
    //         chunks.forEach((chunk) => {
    //           templates.push({
    //             type: 'image-text',
    //             props: {
    //               title: section.title,
    //               content: chunk,
    //               image: section.image
    //             }
    //           });
    //         });
    //       }
    //     });

    //     if (data.targetMarket || data.marketFit) {
    //       const content = [
    //         data.targetMarket && `Primary Market: ${data.targetMarket}`,
    //         data.marketFit && `Market Fit: ${data.marketFit}`,
    //       ].filter(Boolean).join('\n\n');

    //       const cleanContent = this.stripMarkdown(content);
    //       const chunks = this.splitTextIntoChunks(cleanContent, 350);
    //       chunks.forEach((chunk) => {
    //         templates.push({
    //           type: 'image-text',
    //           props: {
    //             title: 'TARGET MARKET & MARKET FIT',
    //             content: chunk,
    //             image: path.join(outputDir, 'template_2_image_10.jpg')
    //           }
    //         });
    //       });
    //     }

    //     if (data.capex || data.opex) {
    //       const opexExpense = data.opex?.[0]?.opexExpense;
    //       templates.push({
    //         type: 'startup-costs',
    //         props: {
    //           capex: data.capex || [],
    //           opex: this.extractOpexData(opexExpense) || []
    //         }
    //       });
    //     }

    //     const financialProjections = this.constructFinancialProjections(data);
    //     if (financialProjections) {
    //       templates.push({
    //         type: 'financial-projections',
    //         props: { data: financialProjections }
    //       });
    //     }

    //     if (data.futurePlans) {
    //       const cleanContent = this.stripMarkdown(this.safeText(data.futurePlans));
    //       const chunks = this.splitTextIntoChunks(cleanContent, 350);
    //       chunks.forEach((chunk) => {
    //         templates.push({
    //           type: 'content',
    //           props: {
    //             title: 'FUTURE DEVELOPMENTS',
    //             content: chunk
    //           }
    //         });
    //       });
    //     }

    //     // i just add thios code for yellaow colour
    //     templates.push({
    //   type: 'content-box',
    //   props: {
    //     title: 'PROTOTYPE',
    //     content: this.stripMarkdown(this.safeText(data.prototypeDescription)),
    //     style: 'dark-yellow'
    //   }
    // });

    //     templates.push({
    //       type: 'content',
    //       props: {
    //         title: 'THANK YOU',
    //         content: `We'd love to collaborate and bring this vision to life.`
    //       }
    //     });

    //     return templates;

    const sections = [
      {
        title: 'PROBLEM',
        content: data.problemStatement,
        image: path.join(outputDir, 'image_1.png'),
      },

      {
        title: 'SOLUTION',
        content: data.idea,
        image: path.join(outputDir, 'image_2.png'),
      },

      {
        title: 'PROTOTYPE',
        content: data.prototypeDescription,
        image: path.join(outputDir, 'image_3.png'),
      },

      {
        title: 'TARGET MARKET & MARKET FIT',
        content: [data.targetMarket && `Primary Market: ${data.targetMarket}`, data.marketFit && `Market Fit: ${data.marketFit}`].filter(Boolean).join('\n\n'),
        image: path.join(outputDir, 'image_5.png'),
      },

      {
        title: 'MARKETING STRATEGY',
        content: data.marketing,
        image: path.join(outputDir, 'image_6.png'),
      },

      {
        title: 'MARKET COMPETITION',
        content: data.marketCompetitors,
        image: path.join(outputDir, 'image_5.png'), // same as competition image
      },

      {
        title: 'REVENUE MODEL',
        content: this.formatRevenueModel(data.revenueModel),
        image: path.join(outputDir, 'image_7.png'),
      },
    ];

    // Push sections into templates
    sections.forEach((section) => {
      if (section.content) {
        const cleanContent = this.stripMarkdown(this.safeText(section.content));
        const chunks = this.splitTextIntoChunks(cleanContent, 230);
        chunks.forEach((chunk) => {
          templates.push({
            type: 'image-text',
            props: {
              title: section.title,
              content: chunk,
              image: section.image,
            },
          });
        });
      }
    });

    if (data.capex || data.opex) {
      const opexExpense = data.opex?.[0]?.opexExpense;
      templates.push({
        type: 'startup-costs',
        props: {
          capex: data.capex || [],
          opex: this.extractOpexData(opexExpense) || [],
          monthlyOpex: data.opex?.[0]?.opex,
        },
      });
    }

    const financialProjections = this.constructFinancialProjections(data);
    if (financialProjections) {
      templates.push({
        type: 'financial-projections',
        props: { data: financialProjections },
      });
    }

    if (data.futurePlans) {
      const cleanContent = this.stripMarkdown(this.safeText(data.futurePlans));
      const chunks = this.splitTextIntoChunks(cleanContent, 350);
      chunks.forEach((chunk) => {
        templates.push({
          type: 'content',
          props: {
            title: 'FUTURE DEVELOPMENTS',
            content: chunk,
          },
        });
      });
    }

    templates.push({
      type: 'content',
      props: {
        title: 'THANK YOU',
        content: `We'd love to collaborate and bring this vision to life.`,
      },
    });

    return templates;
  }

  private renderSlideTemplate2(pptx: any, template: SlideTemplate): void {
    const slide = pptx.addSlide();

    switch (template.type) {
      case 'title':
        slide.background = { fill: 'CDFF00' };
        slide.addText('PITCH\nDeck', {
          x: 0,
          y: 2.5,
          w: 10,
          h: 3,
          fontSize: 90,
          bold: true,
          color: '000000',
          fontFace: 'Arial',
          align: 'center',
          valign: 'middle',
          lineSpacing: 80,
        });
        break;

      case 'image-text':
        slide.background = { fill: 'FFFFFF' };

        if (template.props.image) {
          try {
            slide.addImage({
              path: template.props.image,
              x: 0,
              y: 0,
              w: 5,
              h: 5.625,
              sizing: { type: 'cover', w: 5, h: 5.625 },
            });
          } catch (error) {
            console.error('Error adding image:', error);
          }
        }

        slide.addText(template.props.title.toUpperCase(), {
          x: 5.2,
          y: 1.0,
          w: 4.3,
          h: 0.8,
          fontSize: 32,
          bold: true,
          color: '000000',
          fontFace: 'Arial',
        });

        if (template.props.content) {
          slide.addText(template.props.content, {
            x: 5.2,
            y: 2.0,
            w: 4.3,
            h: 3.0,
            fontSize: 14,
            color: '000000',
            lineSpacing: 22,
            fontFace: 'Arial',
            valign: 'top',
            breakLine: true,
          });
        }
        break;

      case 'content':
        slide.background = { fill: 'CDFF00' };
        slide.addText(template.props.title.toUpperCase(), {
          x: 0.8,
          y: 1.0,
          w: 8.4,
          h: 1.0,
          fontSize: 48,
          bold: true,
          color: '000000',
          fontFace: 'Arial',
        });

        if (template.props.content) {
          slide.addText(template.props.content, {
            x: 0.8,
            y: 2.3,
            w: 8.4,
            h: 2.5,
            fontSize: 18,
            color: '000000',
            lineSpacing: 26,
            fontFace: 'Arial',
            valign: 'top',
            breakLine: true,
          });
        }
        break;

      case 'startup-costs':
        slide.background = { fill: 'FFFFFF' };
        slide.addText('STARTUP COSTS', {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.7,
          fontSize: 40,
          bold: true,
          color: '000000',
          fontFace: 'Arial',
        });

        this.addStyledTableTemplate2(slide, 'CAPEX', 'Costs', template.props.capex || [], 0.5);
        this.addStyledTableTemplate2(slide, 'OPEX', 'Costs', template.props.opex || [], 5.3);
        break;

      case 'financial-projections':
        this.renderFinancialProjectionsTemplate2(slide, template.props);
        break;
    }
  }

  private addStyledTableTemplate2(slide: any, header1: string, header2: string, data: any[], x: number): void {
    const rows: any[] = [
      [
        { text: header1, options: { fill: { color: 'CDFF00' }, bold: true, fontSize: 16, color: '000000', align: 'center', border: { pt: 2, color: '000000' } } },
        { text: header2, options: { fill: { color: 'CDFF00' }, bold: true, fontSize: 16, color: '000000', align: 'center', border: { pt: 2, color: '000000' } } },
      ],
    ];

    data.slice(0, 10).forEach((item) => {
      rows.push([
        { text: String(item.name || Object.keys(item)[0] || ''), options: { fontSize: 12, color: '000000', align: 'left', border: { pt: 1, color: '000000' } } },
        { text: String(item.cost || Object.values(item)[0] || ''), options: { fontSize: 12, color: '000000', align: 'center', border: { pt: 1, color: '000000' } } },
      ]);
    });

    slide.addTable(rows, { x, y: 1.5, w: 4.2, colW: [2.5, 1.7], rowH: 0.35 });
  }

  private renderFinancialProjectionsTemplate2(slide: any, props: any): void {
    slide.background = { fill: 'FFFFFF' };
    slide.addText('FINANCIAL PROJECTIONS', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.7,
      fontSize: 38,
      bold: true,
      color: '000000',
      fontFace: 'Arial',
    });

    const data = Array.isArray(props.data) ? props.data : [];
    const rows: any[] = [
      [
        { text: 'Sales Units', options: { fill: { color: 'CDFF00' }, bold: true, fontSize: 12, color: '000000', align: 'center', border: { pt: 2, color: '000000' } } },
        { text: 'Year 1', options: { fill: { color: 'CDFF00' }, bold: true, fontSize: 12, color: '000000', align: 'center', border: { pt: 2, color: '000000' } } },
        { text: 'Year 2', options: { fill: { color: 'CDFF00' }, bold: true, fontSize: 12, color: '000000', align: 'center', border: { pt: 2, color: '000000' } } },
        { text: 'Year 3', options: { fill: { color: 'CDFF00' }, bold: true, fontSize: 12, color: '000000', align: 'center', border: { pt: 2, color: '000000' } } },
        { text: 'Year 4', options: { fill: { color: 'CDFF00' }, bold: true, fontSize: 12, color: '000000', align: 'center', border: { pt: 2, color: '000000' } } },
        { text: 'Year 5', options: { fill: { color: 'CDFF00' }, bold: true, fontSize: 12, color: '000000', align: 'center', border: { pt: 2, color: '000000' } } },
      ],
    ];

    data.forEach((row) => {
      rows.push([
        { text: String(row.metric || ''), options: { fontSize: 10, color: '000000', align: 'center', border: { pt: 1, color: '000000' } } },
        { text: String(row.year1 || ''), options: { fontSize: 10, color: '000000', align: 'center', border: { pt: 1, color: '000000' } } },
        { text: String(row.year2 || ''), options: { fontSize: 10, color: '000000', align: 'center', border: { pt: 1, color: '000000' } } },
        { text: String(row.year3 || ''), options: { fontSize: 10, color: '000000', align: 'center', border: { pt: 1, color: '000000' } } },
        { text: String(row.year4 || ''), options: { fontSize: 10, color: '000000', align: 'center', border: { pt: 1, color: '000000' } } },
        { text: String(row.year5 || ''), options: { fontSize: 10, color: '000000', align: 'center', border: { pt: 1, color: '000000' } } },
      ]);
    });

    const totals = this.calculateTotals(data);
    rows.push([
      { text: 'Total', options: { fontSize: 10, color: '000000', align: 'right', bold: true, border: { pt: 1, color: '000000' } } },
      { text: totals.year1, options: { fontSize: 10, color: '000000', align: 'center', bold: true, border: { pt: 1, color: '000000' } } },
      { text: totals.year2, options: { fontSize: 10, color: '000000', align: 'center', bold: true, border: { pt: 1, color: '000000' } } },
      { text: totals.year3, options: { fontSize: 10, color: '000000', align: 'center', bold: true, border: { pt: 1, color: '000000' } } },
      { text: totals.year4, options: { fontSize: 10, color: '000000', align: 'center', bold: true, border: { pt: 1, color: '000000' } } },
      { text: totals.year5, options: { fontSize: 10, color: '000000', align: 'center', bold: true, border: { pt: 1, color: '000000' } } },
    ]);

    slide.addTable(rows, {
      x: 0.5,
      y: 1.4,
      w: 6.8,
      colW: [1.3, 1.1, 1.1, 1.1, 1.1, 1.1],
      rowH: 0.26,
    });

    slide.addText('break-even point', {
      x: 7.8,
      y: 2.0,
      w: 2.0,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: '000000',
      align: 'center',
      fontFace: 'Arial',
    });

    slide.addShape(slide.constructor.ShapeType?.rect || 'rect', {
      x: 7.8,
      y: 2.6,
      w: 2.0,
      h: 0.7,
      fill: { color: '2D2D2D' },
    });

    slide.addText('Year 1,\nMonth 3', {
      x: 7.8,
      y: 2.6,
      w: 2.0,
      h: 0.7,
      fontSize: 16,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      fontFace: 'Arial',
    });
  }

  // private generateSlidesHTMLTemplate2(slideTemplates: SlideTemplate[], data: any): string {
  //   const slides = slideTemplates.map((template, index) => {
  //     return this.generateSlideHTMLTemplate2(template, index);
  //   }).join('\n');

  //   return `
  //     <!DOCTYPE html>
  //     <html lang="en">
  //     <head>
  //       <meta charset="UTF-8">
  //       <title>Pitch Deck</title>
  //       <style>
  //         * { margin: 0; padding: 0; box-sizing: border-box; }
  //         body { font-family: Arial, sans-serif; background: #FFFFFF; }
  //         .slide {
  //           width: 1920px; height: 1080px;
  //           page-break-after: always; page-break-inside: avoid;
  //           position: relative; display: flex; overflow: hidden;
  //         }
  //         .slide:last-child { page-break-after: auto; }
  //         .title-slide {
  //           background: #CDFF00; flex-direction: column;
  //           justify-content: center; align-items: center; padding: 100px;
  //         }
  //         .title-slide .main-title {
  //           font-size: 180px; font-weight: 900; color: #000000;
  //           line-height: 0.9; text-align: center;
  //         }
  //         .image-text-slide { background: #FFFFFF; }
  //         .image-text-slide.dark { background: #2D2D2D; }
  //         .image-text-slide.yellow { background: #CDFF00; }
  //         .slide-layout { display: flex; width: 100%; height: 100%; }
  //         .slide-layout.reverse { flex-direction: row-reverse; }
  //         .image-section {
  //           flex: 0 0 50%; display: flex; align-items: center;
  //           justify-content: center; padding: 60px;
  //         }
  //         .image-section img { width: 100%; height: 100%; object-fit: cover; }
  //         .text-section {
  //           flex: 0 0 50%; padding: 100px 80px;
  //           display: flex; flex-direction: column; justify-content: center;
  //         }
  //         .slide-title {
  //           font-size: 60px; font-weight: 900; color: #000000;
  //           margin-bottom: 60px; line-height: 1.1; letter-spacing: -1px;
  //         }
  //         .slide-title.yellow { color: #CDFF00; }
  //         .slide-title.white { color: #FFFFFF; }
  //         .slide-content { font-size: 28px; color: #000000; line-height: 1.6; }
  //         .slide-content.white { color: #FFFFFF; }
  //         .slide-content p { margin-bottom: 20px; }
  //         .full-text-slide {
  //           background: #CDFF00; padding: 100px 120px;
  //           flex-direction: column; justify-content: center;
  //         }
  //         .full-text-slide .slide-title { font-size: 90px; margin-bottom: 80px; }
  //         .full-text-slide .slide-content { font-size: 35px; max-width: 1200px; }
  //         .costs-slide {
  //           background: #FFFFFF; padding: 80px 100px; flex-direction: column;
  //         }
  //         .costs-slide .slide-title { font-size: 70px; margin-bottom: 60px; }
  //         .costs-tables { display: flex; gap: 60px; flex: 1; }
  //         .costs-table { flex: 1; }
  //         table { width: 100%; border-collapse: collapse; border: 3px solid #000000; }
  //         th {
  //           background: #CDFF00; color: #000000; font-size: 32px;
  //           font-weight: 900; padding: 25px 30px; text-align: center;
  //           border: 3px solid #000000;
  //         }
  //         td {
  //           background: #FFFFFF; color: #000000; font-size: 24px;
  //           padding: 20px 30px; border: 2px solid #000000;
  //         }
  //         td:first-child { text-align: left; font-weight: 600; }
  //         td:last-child { text-align: center; }
  //         .projections-slide {
  //           background: #FFFFFF; padding: 80px 100px; flex-direction: column;
  //         }
  //         .projections-slide .slide-title { font-size: 70px; margin-bottom: 50px; }
  //         .projections-content { display: flex; gap: 60px; flex: 1; }
  //         .projections-table { flex: 1; }
  //         .projections-table table { font-size: 20px; }
  //         .projections-table th { font-size: 26px; padding: 20px 15px; }
  //         .projections-table td {
  //           font-size: 20px; padding: 15px 12px; text-align: center;
  //         }
  //         .projections-table td:first-child { text-align: center; font-weight: 600; }
  //         .break-even-box {
  //           flex: 0 0 400px; display: flex; flex-direction: column;
  //           justify-content: center; align-items: center; gap: 40px;
  //         }
  //         .break-even-title {
  //           font-size: 32px; font-weight: 900; color: #000000;
  //           text-align: center; line-height: 1.2;
  //         }
  //         .break-even-value {
  //           background: #2D2D2D; color: #FFFFFF; padding: 50px 60px;
  //           font-size: 32px; font-weight: 900; text-align: center;
  //           width: 100%; border-radius: 8px;
  //         }
  //       </style>
  //     </head>
  //     <body>${slides}</body>
  //     </html>
  //   `;
  // }
  // changed code for overfooe pdf
  private generateSlidesHTMLTemplate2(slideTemplates: SlideTemplate[], data: any): string {
    const slides = slideTemplates
      .map((template, index) => {
        return this.generateSlideHTMLTemplate2(template, index);
      })
      .join('\n');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Pitch Deck</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #FFFFFF; }
        .slide {
          width: 1920px; height: 1080px;
          page-break-after: always; page-break-inside: avoid;
          position: relative; display: flex; overflow: hidden;
        }
        .slide:last-child { page-break-after: auto; }
        .title-slide {
          background: #CDFF00; flex-direction: column;
          justify-content: center; align-items: center; padding: 100px;
        }
        .title-slide .main-title {
          font-size: 180px; font-weight: 900; color: #000000;
          line-height: 0.9; text-align: center;
        }
        .image-text-slide { background: #FFFFFF; }
        .image-text-slide.dark { background: #2D2D2D; }
        .image-text-slide.yellow { background: #CDFF00; }
        .slide-layout { 
          display: flex; 
          width: 100%; 
          height: 100%; 
          align-items: stretch; /* Changed from default */
        }
        .slide-layout.reverse { flex-direction: row-reverse; }
        .image-section {
          flex: 0 0 50%; 
          display: flex; 
          align-items: center;
          justify-content: center; 
          padding: 0; /* Removed padding */
          overflow: hidden; /* Added */
        }
        .image-section img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          display: block; /* Added */
        }
        .text-section {
          flex: 0 0 50%; 
          padding: 80px 60px; /* Reduced padding */
          display: flex; 
          flex-direction: column; 
          justify-content: flex-start; /* Changed from center */
          overflow: hidden; /* Added */
        }
        .slide-title {
          font-size: 55px; /* Slightly reduced */
          font-weight: 900; 
          color: #000000;
          margin-bottom: 40px; /* Reduced */
          line-height: 1.1; 
          letter-spacing: -1px;
          flex-shrink: 0; /* Added */
        }
        .slide-title.yellow { color: #CDFF00; }
        .slide-title.white { color: #FFFFFF; }
        .slide-content { 
          font-size: 24px; /* Reduced from 28px */
          color: #000000; 
          line-height: 1.5; /* Reduced from 1.6 */
          overflow-y: auto; /* Changed from default */
          flex: 1; /* Added */
        }
        .slide-content.white { color: #FFFFFF; }
        .slide-content p { margin-bottom: 15px; } /* Reduced from 20px */
        .full-text-slide {
          background: #CDFF00; padding: 100px 120px;
          flex-direction: column; justify-content: center;
        }
        .full-text-slide .slide-title { font-size: 90px; margin-bottom: 80px; }
        .full-text-slide .slide-content { font-size: 35px; max-width: 1200px; }
        .costs-slide {
          background: #FFFFFF; padding: 80px 100px; flex-direction: column;
        }
        .costs-slide .slide-title { font-size: 70px; margin-bottom: 60px; }
        .costs-tables { display: flex; gap: 60px; flex: 1; }
        .costs-table { flex: 1; }
        table { width: 100%; border-collapse: collapse; border: 3px solid #000000; }
        th {
          background: #CDFF00; color: #000000; font-size: 32px;
          font-weight: 900; padding: 25px 30px; text-align: center;
          border: 3px solid #000000;
        }
        td {
          background: #FFFFFF; color: #000000; font-size: 24px;
          padding: 20px 30px; border: 2px solid #000000;
        }
        td:first-child { text-align: left; font-weight: 600; }
        td:last-child { text-align: center; }
        .projections-slide {
          background: #FFFFFF; padding: 80px 100px; flex-direction: column;
        }
        .projections-slide .slide-title { font-size: 70px; margin-bottom: 50px; }
        .projections-content { display: flex; gap: 60px; flex: 1; }
        .projections-table { flex: 1; }
        .projections-table table { font-size: 20px; }
        .projections-table th { font-size: 26px; padding: 20px 15px; }
        .projections-table td {
          font-size: 20px; padding: 15px 12px; text-align: center;
        }
        .projections-table td:first-child { text-align: center; font-weight: 600; }
        .break-even-box {
          flex: 0 0 400px; display: flex; flex-direction: column;
          justify-content: center; align-items: center; gap: 40px;
        }
        .break-even-title {
          font-size: 32px; font-weight: 900; color: #000000;
          text-align: center; line-height: 1.2;
        }
        .break-even-value {
          background: #2D2D2D; color: #FFFFFF; padding: 50px 60px;
          font-size: 32px; font-weight: 900; text-align: center;
          width: 100%; border-radius: 8px;
        }
      </style>
    </head>
    <body>${slides}</body>
    </html>
  `;
  }

  private generateSlideHTMLTemplate2(template: SlideTemplate, index: number): string {
    const isBase64 = template.props.image && template.props.image.startsWith('data:');

    switch (template.type) {
      case 'title':
        return `
          <div class="slide title-slide">
            <div class="main-title">PITCH<br>Deck</div>
          </div>
        `;

      case 'image-text':
        const isDark = index % 3 === 0;
        const isYellow = index % 3 === 1;
        const bgClass = isDark ? 'dark' : isYellow ? 'yellow' : '';
        const titleClass = isDark ? 'yellow' : '';
        const contentClass = isDark ? 'white' : '';
        const layoutClass = index % 2 === 0 ? '' : 'reverse';

        return `
          <div class="slide image-text-slide ${bgClass}">
            <div class="slide-layout ${layoutClass}">
              <div class="image-section">
                ${
                  template.props.image && isBase64 ? `<img src="${template.props.image}" alt="Slide image">` : '<div style="width: 100%; height: 100%; background: #4A90E2;"></div>'
                }
              </div>
              <div class="text-section">
                <div class="slide-title ${titleClass}">${template.props.title}</div>
                <div class="slide-content ${contentClass}">${this.formatTextWithParagraphs(template.props.content || '')}</div>
              </div>
            </div>
          </div>
        `;

      case 'content':
        return `
          <div class="slide full-text-slide">
            <div class="slide-title">${template.props.title}</div>
            <div class="slide-content">${this.formatTextWithParagraphs(template.props.content || '')}</div>
          </div>
        `;

      case 'startup-costs':
        return `
          <div class="slide costs-slide">
            <div class="slide-title">STARTUP COSTS</div>
            <div class="costs-tables">
              ${this.generateTableHTMLTemplate2('CAPEX', 'Costs', template.props.capex)}
              ${this.generateTableHTMLTemplate2('OPEX', 'Costs', template.props.opex)}
            </div>
          </div>
        `;

      case 'financial-projections':
        return this.generateFinancialProjectionHTMLTemplate2(template.props.data);

      default:
        return '';
    }
  }

  private generateTableHTMLTemplate2(header1: string, header2: string, data: any[]): string {
    const rows = data
      .slice(0, 10)
      .map(
        (item) => `
      <tr>
        <td>${item.name || Object.keys(item)[0] || ''}</td>
        <td>${item.cost || Object.values(item)[0] || ''}</td>
      </tr>
    `,
      )
      .join('');

    return `
      <div class="costs-table">
        <table>
          <thead><tr><th>${header1}</th><th>${header2}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  private generateFinancialProjectionHTMLTemplate2(data: any[]): string {
    const rows = data
      .map(
        (row) => `
      <tr>
        <td>${row.metric}</td>
        <td>${row.year1 || '-'}</td>
        <td>${row.year2 || '-'}</td>
        <td>${row.year3 || '-'}</td>
        <td>${row.year4 || '-'}</td>
        <td>${row.year5 || '-'}</td>
      </tr>
    `,
      )
      .join('');

    const totals = this.calculateTotals(data);

    return `
      <div class="slide projections-slide">
        <div class="slide-title">FINANCIAL PROJECTIONS</div>
        <div class="projections-content">
          <div class="projections-table">
            <table>
              <thead>
                <tr>
                  <th>Sales Units</th><th>Year 1</th><th>Year 2</th>
                  <th>Year 3</th><th>Year 4</th><th>Year 5</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                <tr style="font-weight: bold;">
                  <td>Total</td>
                  <td>${totals.year1}</td><td>${totals.year2}</td>
                  <td>${totals.year3}</td><td>${totals.year4}</td><td>${totals.year5}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="break-even-box">
            <div class="break-even-title">break-even point</div>
            <div class="break-even-value">Year 1,<br>Month 3</div>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== SHARED HELPER METHODS ====================

  private formatTextWithParagraphs(text: string): string {
    if (!text) return '';

    const paragraphs = text.split('\n\n').filter((p) => p.trim());
    if (paragraphs.length > 1) {
      return paragraphs.map((p) => `<p>${this.escapeHtml(p.trim())}</p>`).join('');
    }

    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length > 1) {
      return lines.map((l) => `<p>${this.escapeHtml(l.trim())}</p>`).join('');
    }

    return `<p>${this.escapeHtml(text)}</p>`;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]).replace(/\n/g, '<br>');
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

  private safeText(val: any): string {
    if (val === undefined || val === null) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join('\n');
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  }

  private stripMarkdown(text: string): string {
    if (!text) return text;
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim();
  }

  private splitTextIntoChunks(text: string, maxChars: number): string[] {
    if (!text || text.length <= maxChars) {
      return [text];
    }

    const chunks: string[] = [];
    const sections = text.split('\n\n'); // Split by double newline (paragraphs)

    let currentChunk = '';

    for (const section of sections) {
      const testChunk = currentChunk ? currentChunk + '\n\n' + section : section;

      if (testChunk.length <= maxChars) {
        currentChunk = testChunk;
      } else {
        // Current chunk is full, save it and start new one
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // If single section is too long, split by sentences
        if (section.length > maxChars) {
          const sentences = section.split('. ');
          currentChunk = '';

          for (const sentence of sentences) {
            const testSentence = currentChunk ? currentChunk + '. ' + sentence : sentence;

            if (testSentence.length <= maxChars) {
              currentChunk = testSentence;
            } else {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
              }
              currentChunk = sentence;
            }
          }
        } else {
          currentChunk = section;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  private formatRevenueModel(revenueModel: any): string {
    if (!revenueModel) return '';
    if (typeof revenueModel === 'string') return revenueModel;
    return revenueModel.revenueModel || '';
  }

  private extractOpexData(opexData: any): any[] {
    if (!opexData) return [];

    if (typeof opexData === 'object' && !Array.isArray(opexData)) {
      const result: any[] = [];
      const yearMapping: { [key: string]: string } = {
        y1: 'Year 1',
        y2: 'Year 2',
        y3: 'Year 3',
        y4: 'Year 4',
        y5: 'Year 5',
      };

      Object.entries(opexData).forEach(([key, value]) => {
        if (yearMapping[key]) {
          result.push({ name: yearMapping[key], cost: value });
        }
      });

      return result;
    }

    return [];
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
}
