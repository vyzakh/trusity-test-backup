import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export function getRequestFromContext(context: ExecutionContext) {
  const gqlCtx = GqlExecutionContext.create(context);

  const ctx = gqlCtx.getContext();
  const args = gqlCtx.getArgs();

  return {
    request: ctx.req,
    response: ctx.res,
    args,
  };
}
