import { AppException } from './base.exception';

export class NotFoundException extends AppException {
  constructor(message = 'Resource not found') {
    super({
      message,
      code: 'RESOURCE_NOT_FUND',
      statusCode: 404,
    });
  }
}
