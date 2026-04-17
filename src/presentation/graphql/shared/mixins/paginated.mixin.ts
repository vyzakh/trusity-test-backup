import { Field, Int } from '@nestjs/graphql';
import { Constructor } from './types';

export function Paginated<TBase extends Constructor>(Base: TBase) {
  class Paginated extends Base {
    @Field(() => Int, { nullable: true })
    limit?: number = 10;

    @Field(() => Int, { nullable: true })
    offset?: number = 0;
  }

  return Paginated;
}
