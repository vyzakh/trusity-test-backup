import { GraphQLCustomError } from '../base/graphql-custom.error';

export class UnauthorizedError extends GraphQLCustomError {
  constructor(message = 'Authentication required') {
    super(message, {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }
}
