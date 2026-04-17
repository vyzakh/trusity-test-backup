export enum AppExceptionType {
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  GRADE_SECTION_MISMATCH = 'GRADE_SECTION_MISMATCH',
}

export type AdditionalData = {
  type: AppExceptionType;
};

export interface AppExceptionOptions {
  message: string;
  code?: string;
  statusCode?: number;
  validationErrors?: any;
  additionalData?: AdditionalData;
}

export class AppException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly validationErrors?: any;
  public readonly type?: AppExceptionType;

  constructor(options: AppExceptionOptions) {
    super(options.message);
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.type = options.additionalData?.type;
    this.statusCode = options.statusCode ?? 500;
    this.validationErrors = options.validationErrors;
  }
}
