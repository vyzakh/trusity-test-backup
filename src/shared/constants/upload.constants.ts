import { ObjectCannedACL } from '@aws-sdk/client-s3';
import { FileType } from '../enums/file-types.enum';

export const UPLOAD_CONFIG: Record<
  FileType,
  {
    mimeTypes: string[];
    maxSize: number;
    extensions: string[];
    baseFolder: string;
    acl: ObjectCannedACL;
  }
> = {
  [FileType.CHALLENGE_LOGO]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024,
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    acl: 'public-read',
    baseFolder: 'challenge-logos',
  },
  [FileType.SCHOOL_LOGO]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024,
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    acl: 'public-read',
    baseFolder: 'school-logos',
  },
  [FileType.BUSINESS_MODEL_PDF]: {
    mimeTypes: ['application/pdf'],
    maxSize: 10 * 1024 * 1024,
    extensions: ['.pdf'],
    acl: 'public-read',
    baseFolder: 'business-models',
  },
  [FileType.BUSINESS_LEARNING_FILE]: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ],
    maxSize: 50 * 1024 * 1024,
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.mp4', '.webm', '.mov'],
    acl: 'public-read',
    baseFolder: 'business-learning-files',
  },
  [FileType.PITCH_FEEDBACK_FILE]: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxSize: 50 * 1024 * 1024,
    extensions: ['.mp4', '.webm', '.mov'],
    acl: 'public-read',
    baseFolder: 'pitch-feedback-files',
  },
  [FileType.USER_AVATARS]: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024,
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    acl: 'public-read',
    baseFolder: 'user-avatars',
  },
  [FileType.BULK_UPLOAD_STUDENTS]: {
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.oasis.opendocument.spreadsheet'],
    maxSize: 10 * 1024 * 1024,
    extensions: ['.xls', '.xlsx', '.ods'],
    acl: 'private',
    baseFolder: 'bulk-uploads',
  },
  [FileType.COUNTRY_AVATARS]: {
    mimeTypes: ['image/png', 'image/svg+xml', 'image/gif'],
    maxSize: 5 * 1024 * 1024,
    extensions: ['.png', '.svg', '.gif'],
    acl: 'public-read',
    baseFolder: 'country-avatars',
  },
} as const;
