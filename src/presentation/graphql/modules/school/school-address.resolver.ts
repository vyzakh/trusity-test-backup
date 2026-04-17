import { GetCityUseCase, GetCountryUseCase, GetStateUseCase } from '@application/use-cases';
import { DatabaseService, LookupRepository } from '@infrastructure/database';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { City, Country, State } from '../common/types';
import { SchoolAddress } from './types';

@Resolver(() => SchoolAddress)
export class SchoolAddressResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => Country, { nullable: true })
  async country(@Parent() address: SchoolAddress) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetCountryUseCase({ lookupRepo });

        const data = await useCase.execute({
          data: { countryId: address.countryId },
        });

        return data;
      },
    });
    return data;
  }
  @ResolveField(() => State, { nullable: true })
  async state(@Parent() address: SchoolAddress) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetStateUseCase({ lookupRepo });

        const data = await useCase.execute({
          data: { stateId: address.stateId },
        });

        return data;
      },
    });
    return data;
  }

  @ResolveField(() => City, { nullable: true })
  async city(@Parent() address: SchoolAddress) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetCityUseCase({ lookupRepo });

        const data = await useCase.execute({
          data: { cityId: address.cityId },
        });

        return data;
      },
    });
    return data;
  }
}
