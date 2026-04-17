import { FileType } from '@shared/enums/file-types.enum';

export interface UploadFileUseCaseInput {
  data: {
    fileName: string;
    mimeType: string;
    fileType: FileType;
  };
}
