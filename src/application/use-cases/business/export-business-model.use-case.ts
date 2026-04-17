import { UploadFileUseCase } from '@application/modules/media/use-cases/upload-file.use-case';
import { ICurrentStudentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { compileHbsTemplate } from '@shared/utils';
import { renderHtmlToPdf } from '@shared/utils/html-to-pdf.util';
import * as path from 'path';

interface ExportBusinessModelInput {
  data: { businessId: string };
  user: ICurrentStudentUser;
}

export class ExportBusinessModelUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository; s3Service: S3Service }) {}

  async execute(input: ExportBusinessModelInput) {
    const { businessRepo, s3Service } = this.dependencies;

    const businessModel = await businessRepo.getBusinessModel({
      businessId: input.data.businessId,
    });

    if (!businessModel?.businessModel) {
      throw new NotFoundException('The requested businessModel could not be found. Please verify the business ID and try again.');
    }

    const html = await compileHbsTemplate({
      templatePath: path.join(process.cwd(), 'src/presentation/views/business-model-pdf.hbs'),
      context: businessModel.businessModel,
    });

    const businessModelPDF = await renderHtmlToPdf({
      html,
      format: 'A3',
      landscape: true,
    });

    const buffer = Buffer.from(businessModelPDF);

    const result = await s3Service.uploadFile({
      key: `business-models/${UploadFileUseCase.generateFileName('business-model.pdf')}`,
      body: buffer,
      contentType: 'application/pdf',
      acl: 'public-read',
    });

    return result.fileUrl;
  }
}
