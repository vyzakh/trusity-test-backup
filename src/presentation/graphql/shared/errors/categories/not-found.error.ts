import { GraphQLCustomError } from '../base/graphql-custom.error';

export class NotFoundError extends GraphQLCustomError {
  constructor(message: string) {
    super((message = 'Resource not found'), {
      code: 'RESOURCE_NOT_FOUND',
      statusCode: 404,
    });
  }
}
