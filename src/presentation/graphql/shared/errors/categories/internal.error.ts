import { GraphQLCustomError } from '../base/graphql-custom.error';

export class InternalError extends GraphQLCustomError {
  constructor(message = 'Internal server error') {
    super(message, {
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}
