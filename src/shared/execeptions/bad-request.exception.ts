import { AdditionalData, AppException } from './base.exception';

export class BadRequestException extends AppException {
  constructor(message = 'The request could not be completed successfully.', additionalData?: AdditionalData) {
    super({
      message,
      code: 'BAD_REQUEST',
      statusCode: 400,
      additionalData,
    });
  }
}
