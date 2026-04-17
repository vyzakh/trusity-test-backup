import { GraphQLError } from 'graphql';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface CustomErrorOptions {
  code?: string;
  statusCode?: number;
  validationErrors?: ValidationError[];
  [key: string]: any;
}

export class GraphQLCustomError extends GraphQLError {
  constructor(message: string, options: CustomErrorOptions = {}) {
    const { code = 'UNKNOWN_ERROR', statusCode = 500, validationErrors, ...additionalData } = options;

    super(message, {
      extensions: {
        code,
        statusCode,
        validationErrors,
        timestamp: new Date().toISOString(),
        ...additionalData,
      },
    });
  }
}
