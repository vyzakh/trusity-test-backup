import { SetMetadata } from '@nestjs/common';

export const IS_PRIVATE_KEY = Symbol('IS_PRIVATE_KEY');

export const IsPrivate = () => SetMetadata(IS_PRIVATE_KEY, true);
