import { GraphQLCustomError } from '../base/graphql-custom.error';

export class ValidationError extends GraphQLCustomError {
  constructor(
    message = 'Validation failed',
    validationErrors?: Array<{ code?: string; message: string; field: string }>,
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      validationErrors,
    });
  }
}
