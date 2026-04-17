import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TooManyRequestsException } from '@shared/execeptions/too-many-requests.exception';
import { getRequestFromContext } from '../shared/utils';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const { request, response } = getRequestFromContext(context);
    return { req: request, res: response };
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const { user } = req;

    if (user) return user.id;
    if (req.ips.length) return req.ips[0];

    return req.ip;
  }

  protected throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new TooManyRequestsException('You can only perform this action 3 times every 5 minutes. Please wait and try again.');
  }
}
