import { AppException } from './base.exception';

export class TooManyRequestsException extends AppException {
  constructor(message = 'Rate limit exceeded. Please try again later.') {
    super({
      message,
      code: 'TOO_MANY_REQUESTS',
      statusCode: 429,
    });
  }
}
