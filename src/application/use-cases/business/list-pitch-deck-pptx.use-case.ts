import * as PptxGenJS from "pptxgenjs";
import * as fs from 'fs';
import * as path from 'path';

export class ListPitchDeckPPTXUseCase {
  private pptx: any;
  private pptxDir: string = process.cwd(); // Default to current working directory

  constructor() {
    const Pptx = (PptxGenJS as any).default || PptxGenJS;
    this.pptx = new Pptx();
  }


async execute(): Promise<any> {
  const result = fs.readdirSync(this.pptxDir).map((file) => ({
      fileName: file,
      path: path.join(this.pptxDir, file),
    }));
    console.log('resultttttttttt', result);
    
}
}
