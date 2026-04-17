import {
  GetAvatarsUseCase,
  GetChallengeSectorsUseCase,
  GetCitiesUseCase,
  GetCountriesUseCase,
  GetCountryUseCase,
  GetCurrenciesUseCase,
  GetCurriculumsUseCase,
  GetGradesUseCase,
  GetResourcePermissionsUseCase,
  GetResourcesUseCase,
  GetSdgsUseCase,
  GetSectionsUseCase,
  GetStatesUseCase,
  TotalCountriesUseCase,
  UpdateCountryAvatarsUseCase,
} from '@application/use-cases';
import { GetPermissionDependenciesUseCase } from '@application/use-cases/common/get-permission-dependencies.use-case';
import { DatabaseService, LookupRepository } from '@infrastructure/database';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { IsPrivate, RequirePermissions, Scopes } from '@shared/decorators';
import { UserScope } from '@shared/enums';
import { GetCitiesArgs, GetStatesArgs, UpdateCountryAvatarsInput } from './dto';
import { ChallengeSector, City, Country, CountryAvatars, Currency, Curriculum, Grade, Permission, Resource, Sdg, Section, State } from './types';
import { CountriesArgs } from './dto/get-countries.input';

@Resolver()
export class CommonResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @Query(() => String)
  async healthCheck() {
    return 'OK';
  }

  @Query(() => [ChallengeSector])
  async challengeSectors() {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetChallengeSectorsUseCase({
          lookupRepo,
        });

        const data = await useCase.execute();

        return data;
      },
    });

    return data;
  }

  @Query(() => [Country])
  async countries(@Args() args: CountriesArgs) {
    return await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetCountriesUseCase({
          lookupRepo,
        });

        return await useCase.execute({
          data: args
        });
      },
    });

  }

  @Query(() => Int)
  async totalCountries(@Args() args: CountriesArgs) {
    return await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new TotalCountriesUseCase({
          lookupRepo,
        });
        return await useCase.execute({
          data: args
        });
      },
    });
  }

  @Query(() => Country)
  async country(@Args('countryId') countryId: string) {
    return await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetCountryUseCase({
          lookupRepo,
        });
        return await useCase.execute({
          data: { countryId },
        });
      },
    });
  }

  @Mutation(() => CountryAvatars)
  @Scopes(UserScope.PLATFORM_USER)
  @IsPrivate()
  @RequirePermissions('avatar:update')
  async updateCountryAvatars(@Args('input') input: UpdateCountryAvatarsInput) {
    return await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new UpdateCountryAvatarsUseCase({
          lookupRepo,
        });
        const result = await useCase.execute({
          data: input,
        });
        return {
          ...result,
          message: 'Country avatars updated successfully',
        }
      },
    });
  }

  @Query(() => [State])
  async states(@Args() args: GetStatesArgs) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetStatesUseCase({
          lookupRepo,
        });

        const data = await useCase.execute({
          data: { countryId: args.countryId },
        });

        return data;
      },
    });

    return data;
  }

  @Query(() => [City])
  async cities(@Args() args: GetCitiesArgs) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetCitiesUseCase({
          lookupRepo,
        });

        const data = await useCase.execute({
          data: { stateId: args.stateId },
        });

        return data;
      },
    });

    return data;
  }

  @Query(() => [Section])
  async sections() {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetSectionsUseCase({
          lookupRepo,
        });

        const data = await useCase.execute();

        return data;
      },
    });

    return data;
  }

  @Query(() => [Curriculum])
  async curriculums() {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetCurriculumsUseCase({
          lookupRepo,
        });

        const data = await useCase.execute();

        return data;
      },
    });

    return data;
  }

  @Query(() => [Grade])
  async grades() {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetGradesUseCase({
          lookupRepo,
        });

        const data = await useCase.execute();

        return data;
      },
    });

    return data;
  }

  @Query(() => [Sdg])
  async sdgs() {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetSdgsUseCase({
          lookupRepo,
        });

        const data = await useCase.execute();

        return data;
      },
    });

    return data;
  }

  @Query(() => [Currency])
  async currencies() {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetCurrenciesUseCase({
          lookupRepo,
        });

        const data = await useCase.execute();

        return data;
      },
    });

    return data;
  }

  @Query(() => [Resource])
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  async resources() {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetResourcesUseCase({
          lookupRepo,
        });

        const data = await useCase.execute();

        return data;
      },
    });

    return data;
  }
}

@Resolver(() => Country)
export class CountryResolver {
  constructor(private readonly dbService: DatabaseService) {}
  @ResolveField(() => CountryAvatars)
  async avatars(@Parent() country: Country) {
    return await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetAvatarsUseCase({
          lookupRepo,
        });
        return await useCase.execute({
          data: {
            countryId: country.id,
          },
        });
      },
    });
  }
}

@Resolver(() => Resource)
export class ResourceResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => [Permission])
  async permissions(@Parent() resource: Resource) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetResourcePermissionsUseCase({
          lookupRepo,
        });

        const data = await useCase.execute({
          data: {
            resourceId: resource.id,
          },
        });

        return data;
      },
    });

    return data;
  }
}

@Resolver(() => Permission)
export class PermissionResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => [Int])
  async requiredPermissions(@Parent() permission: Permission) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetPermissionDependenciesUseCase({
          lookupRepo,
        });

        return await useCase.execute({
          data: {
            permissionId: permission.id,
          },
        });
      },
    });

    return data;
  }
}
