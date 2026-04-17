import { AppException } from './base.exception';

export class InformationException extends AppException {
  constructor(message = 'The operation completed with informational feedback.') {
    super({
      message,
      code: 'INFORMATION_MESSAGE',
      statusCode: 200,
    });
  }
}
