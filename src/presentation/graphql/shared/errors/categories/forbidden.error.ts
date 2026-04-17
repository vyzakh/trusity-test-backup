import { GraphQLCustomError } from '../base/graphql-custom.error';

export class ForbiddenError extends GraphQLCustomError {
  constructor(message = 'Access forbidden') {
    super(message, {
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  }
}
