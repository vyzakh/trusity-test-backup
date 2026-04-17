import { ArgumentsHost, Catch } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { AppException } from '@shared/execeptions/base.exception';
import { GraphQLError } from 'graphql';
import { FileLogger } from '../shared/logger/file-logger.logger';

@Catch(AppException)
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new FileLogger(GraphQLExceptionFilter.name);

  catch(exception: AppException, host: ArgumentsHost): GraphQLError {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();

    this.logger.error(
      `GraphQL Error in ${info.fieldName}`,
      JSON.stringify(
        {
          message: exception.message,
          code: exception.code,
          statusCode: exception.statusCode,
          stack: exception.stack,
        },
        null,
        2,
      ),
      GraphQLExceptionFilter.name,
    );

    return new GraphQLError(exception.message, {
      extensions: {
        code: exception.code,
        statusCode: exception.statusCode,
      },
    });
  }
}
