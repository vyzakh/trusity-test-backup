import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { UPLOAD_CONFIG } from '@shared/constants/upload.constants';
import { UserScope } from '@shared/enums';
import { FileType } from '@shared/enums/file-types.enum';
import { ForbiddenException, InvalidFileTypeException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';
import { generateUUID } from '@shared/utils/uuid.util';
import * as path from 'path';

interface UploadFileUseCaseInput {
  data: {
    fileName: string;
    fileType: FileType;
    mimeType: string;
  };
  user: ICurrentUser;
}

export class UploadFileUseCase {
  constructor(private readonly s3Service: S3Service) {}

  async execute(input: UploadFileUseCaseInput) {
    const { data, user } = input;

    const fileUploadConfig = this.getFileUploadConfig(data.fileType, {
      name: data.fileName,
      mimeType: data.mimeType,
    });
    if (!fileUploadConfig) {
      throw new InvalidFileTypeException('Please check your request and try again with a valid file type.');
    }

    const fileName = UploadFileUseCase.generateFileName(data.fileName);
    const s3Key = this.resolveS3Key(data.fileType, user, fileUploadConfig.baseFolder, fileName);

    const result = await this.s3Service.generateS3PreSignedUrl({
      acl: fileUploadConfig.acl,
      key: s3Key,
      contentType: data.mimeType,
      expiresIn: 3600,
    });

    return {
      uploadUrl: result.uploadUrl,
      fileKey: s3Key,
      fileUrl: result.fileUrl,
      expiresIn: result.expiresIn,
    };
  }

  private getFileUploadConfig(fileType: FileType, file: { name: string; mimeType: string }) {
    const fileUploadConfig = UPLOAD_CONFIG[fileType];

    if (!fileUploadConfig) return null;

    const ext = path.extname(file.name).toLowerCase();

    if (!fileUploadConfig.extensions.includes(ext)) return null;

    if (!fileUploadConfig.mimeTypes.includes(file.mimeType)) return null;

    return fileUploadConfig;
  }

  static generateFileName(originalName: string) {
    const ext = path.extname(originalName).toLocaleLowerCase();

    const name = path.basename(originalName, ext);

    const timestamp = genTimestamp().millis;

    return `${name}-${timestamp}-${generateUUID()}${ext}`;
  }

  private resolveS3Key(fileType: FileType, user: ICurrentUser, baseFolder: string, fileName: string): string {
    const fileTypeScopeMap: Record<FileType, UserScope[]> = {
      [FileType.CHALLENGE_LOGO]: [UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER],
      [FileType.BUSINESS_LEARNING_FILE]: [UserScope.PLATFORM_USER],
      [FileType.SCHOOL_LOGO]: [UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN],
      [FileType.PITCH_FEEDBACK_FILE]: [UserScope.STUDENT],
      [FileType.BUSINESS_MODEL_PDF]: [UserScope.STUDENT],
      [FileType.USER_AVATARS]: [UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER, UserScope.STUDENT],
      [FileType.BULK_UPLOAD_STUDENTS]: [UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN],
      [FileType.COUNTRY_AVATARS]: [UserScope.PLATFORM_USER],
    };

    const allowedScopes = fileTypeScopeMap[fileType];

    if (!allowedScopes) {
      throw new InvalidFileTypeException('Please check your request and try again with a valid file type.');
    }

    if (!allowedScopes.includes(user.scope)) {
      throw new ForbiddenException('You are not authorized to perform this action.');
    }

    return `${baseFolder}/${fileName}`;
  }
}
