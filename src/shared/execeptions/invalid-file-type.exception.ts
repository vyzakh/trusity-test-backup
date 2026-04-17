import { AppException } from './base.exception';

export class InvalidFileTypeException extends AppException {
  constructor(message = 'The uploaded file type is not allowed.') {
    super({
      message,
      code: 'INVALID_FILE_TYPE',
      statusCode: 400,
    });
  }
}
