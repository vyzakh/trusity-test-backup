import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class GqlLocalAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext) {
    const gqlExecutionContext = GqlExecutionContext.create(context);
    const gqlContext = gqlExecutionContext.getContext();
    const gqlArgs = gqlExecutionContext.getArgs();

    gqlContext.req.body = {
      ...gqlContext.req.body,
      ...gqlArgs,
    };

    return gqlContext.req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = await super.canActivate(context);
    const req = this.getRequest(context);

    await new Promise<void>((resolve, reject) => {
      req.logIn(req.user, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return typeof can === 'boolean' ? can : await lastValueFrom(can);
  }
}
