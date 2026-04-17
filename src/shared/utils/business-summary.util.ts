import * as puppeteer from 'puppeteer';

export type GeneratePdfOptions = puppeteer.PDFOptions & {
  html: string;
};

const defaultPdfOptions: GeneratePdfOptions = {
  html: '<h1>Empty PDF</h1>',
  format: 'A4',
  printBackground: true,
  landscape: false,
};

export async function renderHtmltoPdf(options?: Partial<GeneratePdfOptions>) {
  const mergedOptions = { ...defaultPdfOptions, ...options };

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
    executablePath: '/usr/bin/chromium',
  });

  const page = await browser.newPage();
  await page.setContent(mergedOptions.html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: mergedOptions.format,
    printBackground: mergedOptions.printBackground,
    landscape: mergedOptions.landscape,
  });

  await browser.close();
  return pdfBuffer;
}
