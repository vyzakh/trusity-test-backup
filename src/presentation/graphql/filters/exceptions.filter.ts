import { Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { GraphQLError } from 'graphql';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionsFilter.name);

  catch(exception: any) {
    this.logger.error(exception.message || 'Internal server error', exception.stack, ExceptionsFilter.name);

    const message = exception instanceof HttpException ? exception.message : 'Internal server error';

    const statusCode = exception instanceof HttpException ? exception.getStatus() : 500;

    return new GraphQLError(message, {
      extensions: {
        code: exception.code || 'INTERNAL_SERVER_ERROR',
        statusCode,
      },
    });
  }
}
