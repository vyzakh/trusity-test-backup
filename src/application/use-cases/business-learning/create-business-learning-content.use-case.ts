import { S3Service } from '@infrastructure/aws/services/s3.service';
import { BusinessLearningRepository } from '@infrastructure/database';
import { UPLOAD_CONFIG } from '@shared/constants/upload.constants';
import { FileType } from '@shared/enums';

interface CreateBusinessLearningContentUseCaseInput {
  data: {
    businessLearningStepId: number;
    fileKeys: string[];
    gradeIds: number[];
    sortOrder?: number;
  };
}

export class CreateBusinessLearningContentUseCase {
  constructor(
    private readonly dependencies: {
      s3Service: S3Service;
      businessLearningRepo: BusinessLearningRepository;
    },
  ) {}

  async execute(input: CreateBusinessLearningContentUseCaseInput) {
    const { s3Service, businessLearningRepo } = this.dependencies;
    const { data } = input;

    const results: Record<string, any>[] = [];

    const filesMetadata = await s3Service.getFilesMetadata(data.fileKeys);

    for (const gradeId of data.gradeIds) {
      let maxSortOrder = await businessLearningRepo.getMaxSortOrderForStep(data.businessLearningStepId, gradeId);
      let sortOrder = data.sortOrder ?? (maxSortOrder || 0) + 1;

      for (const fileMetadata of filesMetadata) {
        const mimeType = fileMetadata.ContentType;
        const allowedMimeTypes = UPLOAD_CONFIG[FileType.BUSINESS_LEARNING_FILE].mimeTypes;
        if (!mimeType || !allowedMimeTypes.includes(mimeType)) {
          await s3Service.deleteFile(fileMetadata.fileUrl);
          continue;
        }
        const payload: Record<string, any> = {
          businessLearningStepId: data.businessLearningStepId,
          fileUrl: fileMetadata?.fileUrl,
          mimeType: fileMetadata?.ContentType,
          sortOrder,
          gradeId,
        };
        const created = await businessLearningRepo.createBusinessLearningContent(payload);
        results.push(created);
        sortOrder++;
      }
    }

    return results;
  }
}
