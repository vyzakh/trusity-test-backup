import { SetMetadata } from '@nestjs/common';
import { UserScope } from '@shared/enums';

export const SCOPES_KEY = Symbol('SCOPES_KEY');

export const Scopes = (...scopes: UserScope[]) => SetMetadata(SCOPES_KEY, scopes);
