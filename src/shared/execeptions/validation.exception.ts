import { NodeEnv } from '@shared/enums';
import { AppException } from './base.exception';

export class ValidationException extends AppException {
  constructor(message = 'Validation failed, please check your input.', validationErrors?: any, additionalData?: any) {
    const isDev = process.env.NODE_ENV !== NodeEnv.Production;

    super({
      message: isDev ? message : 'Validation failed, please check your input.',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      validationErrors: isDev ? validationErrors : undefined,
      additionalData: isDev ? additionalData : undefined,
    });
  }
}
