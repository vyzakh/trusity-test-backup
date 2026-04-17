// export interface PitchDeckTemplate {
//   generate(pptx: any, data: any): void;
// }

// export class Template1 implements PitchDeckTemplate {
//   generate(pptx: any, data: any): void {
//     const slide = pptx.addSlide();
//     slide.addText('Template 1 - Classic Design', { x: 1, y: 1, fontSize: 36, bold: true });
//     slide.addText(`Business: ${data.businessName || 'Unknown'}`, { x: 1, y: 2, fontSize: 20 });
//     slide.addText(`Idea: ${data.idea || 'N/A'}`, { x: 1, y: 3, fontSize: 18 });
//   }
// }

// export class Template2 implements PitchDeckTemplate {
//   generate(pptx: any, data: any): void {
//     const slide = pptx.addSlide();
//     slide.addText('Template 2 - Sleek Design', { x: 2, y: 1, fontSize: 40, color: '007ACC' });
//     slide.addText(data.pitchDescription || 'Your pitch here...', { x: 2, y: 2, fontSize: 18 });
//     slide.addText(`Target Market: ${data.targetMarket || 'N/A'}`, { x: 2, y: 3, fontSize: 18 });
//   }
// }

// export class TemplateFactory {
//   static getTemplate(templateId: number): PitchDeckTemplate {
//     switch (templateId) {
//       case 1:
//         return new Template1();
//       case 2:
//         return new Template2();
//       // case 3: return new Template3();
//       // ...
//       default:
//         throw new Error(`Invalid template ID: ${templateId}`);
//     }
//   }
// }

// import * as fs from 'fs';
// import * as path from 'path';
// import * as PptxGenJS from 'pptxgenjs';

// export class GeneratePitchDec1PPTXUseCase {
//   private pptx: any;
//   private pptxDir: string;

//   constructor() {
//     const Pptx = (PptxGenJS as any).default || PptxGenJS;
//     this.pptx = new Pptx();
//     this.pptxDir = path.join(process.cwd(), 'generated_pptx');

//     if (!fs.existsSync(this.pptxDir)) {
//       fs.mkdirSync(this.pptxDir, { recursive: true });
//     }
//   }

//   async execute(
//     data: any,
//     templateId: number,
//   ): Promise<{
//     base64: string;
//     fileName: string;
//     filePath: string;
//   }> {
//     // pick template
//     const template = TemplateFactory.getTemplate(templateId);

//     // generate slides
//     template.generate(this.pptx, data);

//     // export to base64
//     const base64: string = await this.pptx.write('base64');

//     // save file
//     const fileName = `${data.businessName || 'Business'}_Template${templateId}.pptx`;
//     const filePath = path.join(this.pptxDir, fileName);
//     await this.pptx.writeFile({ fileName: filePath });

//     return { base64, fileName, filePath };
//   }
// }
export interface PitchDeckTemplate {
  generate(pptx: any, data: any): void;
}

export class Template1 implements PitchDeckTemplate {
  generate(pptx: any, data: any): void {
    const slide = pptx.addSlide();
    slide.addText('Template 1 - Classic Design', { x: 1, y: 1, fontSize: 36, bold: true });
    slide.addText(`Business: ${data.business_name || 'Unknown'}`, { x: 1, y: 2, fontSize: 20 });
    slide.addText(`Idea: ${data.idea || 'N/A'}`, { x: 1, y: 3, fontSize: 18 });
  }
}

export class Template2 implements PitchDeckTemplate {
  generate(pptx: any, data: any): void {
    const slide = pptx.addSlide();
    slide.addText('Template 2 - Sleek Design', { x: 2, y: 1, fontSize: 40, color: '007ACC' });
    slide.addText(data.pitch_description || 'Your pitch here...', { x: 2, y: 2, fontSize: 18 });
    slide.addText(`Target Market: ${data.target_market || 'N/A'}`, { x: 2, y: 3, fontSize: 18 });
  }
}

export class TemplateFactory {
  static getTemplate(templateId: number): PitchDeckTemplate {
    switch (templateId) {
      case 1:
        return new Template1();
      case 2:
        return new Template2();
      default:
        throw new Error(`Invalid template ID: ${templateId}`);
    }
  }
}

import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import * as fs from 'fs';
import * as path from 'path';
import * as PptxGenJS from 'pptxgenjs';

interface GeneratePitchDec1PPTXUseCaseInput {
  businessId: string;
  templateId: number;
}

export class GeneratePitchDec1PPTXUseCase {
  private readonly pptx: any;
  private readonly pptxDir: string;

  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {
    const Pptx = (PptxGenJS as any).default || PptxGenJS;
    this.pptx = new Pptx();
    this.pptxDir = path.join(process.cwd(), 'generated_pptx');

    if (!fs.existsSync(this.pptxDir)) {
      fs.mkdirSync(this.pptxDir, { recursive: true });
    }
  }

  async execute(input: GeneratePitchDec1PPTXUseCaseInput): Promise<{
    base64: string;
    fileName: string;
    filePath: string;
  }> {
    const { businessRepo } = this.dependencies;
    const { businessId, templateId } = input;

    const business = await businessRepo.getBusiness({ businessId });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const template = TemplateFactory.getTemplate(templateId);

    // Generate slides using business data
    template.generate(this.pptx, business);

    // Export to base64
    const base64: string = await this.pptx.write('base64');

    // Save file
    const fileName = `${business.businessName || 'Business'}_Template${templateId}.pptx`;
    const filePath = path.join(this.pptxDir, fileName);

    await this.pptx.writeFile({ fileName: filePath });

    return { base64, fileName, filePath };
  }
}
