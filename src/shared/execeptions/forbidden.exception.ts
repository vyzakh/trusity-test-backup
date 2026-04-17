import { AppException } from './base.exception';

export class ForbiddenException extends AppException {
  constructor(message = 'Forbidden') {
    super({
      message,
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  }
}
