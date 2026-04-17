import { AppException } from './base.exception';

export class UnauthenticatedException extends AppException {
  constructor(message = 'Unauthorized') {
    super({
      message,
      code: 'UNAUTHENTICATED',
      statusCode: 401,
    });
  }
}
