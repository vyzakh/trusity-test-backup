import { ChallengeSectorMapper, CityMapper, CommonMapper, CountryMapper, CurrencyMapper, CurriculumMapper, SdgMapper, StateMapper } from '@application/mappers';
import { applyOffsetPagination, isDefined } from '@shared/utils';
import { Knex } from 'knex';

export class LookupRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async findAllChallengeSectors() {
    const challengeSectors = await this.db('challenge_sector').select('*');

    return ChallengeSectorMapper.toEntityList(challengeSectors);
  }

  async findAllCountries(input: Record<string, any>) {
    const query = this.db('country')
      .select('*')
      .modify((qb) => {
        if (input.name) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`country.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;

    return CountryMapper.toEntityList(rows);
  }

  async countCountries(input: Record<string, any>) {
    const query = this.db('country')
      .countDistinct('country.id')
      .modify((qb) => {
        if (input.name) {
          const safeRegex = input.name.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
          qb.whereRaw(`country.name ~* ?`, [`.*${safeRegex}.*`]);
        }
      });

    const [{ count }] = await query;

    return Number(count);
  }

  async findCountry(input: any) {
    const [country] = await this.db('country').select(['id', 'name', 'emoji']).where({ id: input.countryId });

    if (!country) {
      return null;
    }

    return CountryMapper.toEntity(country);
  }

  async findState(input: any) {
    const [state] = await this.db('state').select(['id', 'name']).where({ id: input.stateId });

    if (!state) {
      return null;
    }

    return CountryMapper.toEntity(state);
  }

  async findCity(input: any) {
    const [city] = await this.db('city').select(['id', 'name']).where({ id: input.cityId });

    if (!city) {
      return null;
    }

    return CountryMapper.toEntity(city);
  }

  async findStatesByCountryId(input: { countryId: string }) {
    const states = await this.db('state').select('*').where({ country_id: input.countryId });

    return StateMapper.toEntityList(states);
  }

  async findCitiesByStateId(input: { stateId: string }) {
    const cities = await this.db('city').select('*').where({ state_id: input.stateId });

    return CityMapper.toEntityList(cities);
  }

  async findAllGrades() {
    const rows = await this.db('grade').select('*').orderBy('rank', 'asc');

    return CommonMapper.toGrades(rows);
  }

  async getGrade(input: any) {
    const [row] = await this.db('grade').select(['*']).where({
      id: input.gradeId,
    });

    if (!row) return null;

    return CommonMapper.toGrade(row);
  }
  async getGradeSection(input: any) {
    const [row] = await this.db('section').select(['*']).where({
      id: input.sectionId,
    });

    if (!row) return null;

    return CommonMapper.toSection(row);
  }

  async findAllCurriculums() {
    const curriculums = await this.db('curriculum').select('*');

    return CurriculumMapper.toEntityList(curriculums);
  }

  async findAllSections() {
    const rows = await this.db('section').select('*');

    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  async getPrototypeOptions() {
    const rows = await this.db('prototype_option').select('*').where({ is_visible: true });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      prototypeCount: row.prototype_count,
    }));
  }

  async getPrototypeOption(input: Record<string, any>) {
    const [row] = await this.db('prototype_option').select('*').where({ is_visible: true, id: input.prototypeOptionId });

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      prototypeCount: row.prototype_count,
    };
  }

  async findAllSdgs() {
    const sdgs = await this.db('sdg').select('*');

    return SdgMapper.toEntityList(sdgs);
  }

  async getSdgTitlesByIds(input: Record<string, any>) {
    const titles = await this.db('sdg').whereIn('id', input.sdgIds).pluck('title');

    return titles;
  }

  async findAllCurrencies() {
    const currencies = await this.db('currency').select('*');

    return CurrencyMapper.toEntityList(currencies);
  }

  async findChallengeSectorById(input: any) {
    const [challengeSector] = await this.db('challenge_sector').select(['*']).where({ id: input.challengeSectorId });

    if (!challengeSector) {
      return null;
    }

    return ChallengeSectorMapper.toEntity(challengeSector);
  }

  async getResources() {
    const rows = await this.db('resource as r').select(['r.*']).orderBy('r.sort_order', 'asc');

    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        sortOrder: row.sort_order,
        isActive: row.is_active,
      };
    });
  }

  async getResourcePermissions(input: Record<string, any>) {
    const rows = await this.db('resource_permission as rp')
      .select(['p.id', 'p.code', 'p.name', 'p.description'])
      .join('permission as p', 'p.id', 'rp.permission_id')
      .where({ 'rp.resource_id': input.resourceId })
      .orderBy('p.sort_order', 'asc');

    return rows.map((row) => {
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
      };
    });
  }

  async getPermissionDependencies(input: Record<string, any>) {
    const query = this.db('permission_dependency as pd').distinct(['pd.parent_permission_id']);

    if (isDefined(input.permissionId)) {
      query.where({ 'pd.child_permission_id': input.permissionId });
    }
    if (isDefined(input.permissionIds)) {
      query.whereIn('pd.child_permission_id', input.permissionIds);
    }

    const rows = await query;

    return rows.map((row) => row.parent_permission_id);
  }

  async getParentPermissions(input: { permissionIds: number[] }): Promise<number[]> {
    const query = this.db('permission_dependency as pd').distinct(['pd.parent_permission_id']).whereIn('pd.child_permission_id', input.permissionIds);

    const rows = await query;
    return rows.map((row) => row.parent_permission_id);
  }

  async getChildPermissions(input: { permissionIds: number[] }): Promise<number[]> {
    const query = this.db('permission_dependency as pd').distinct(['pd.child_permission_id']).whereIn('pd.parent_permission_id', input.permissionIds);

    const rows = await query;
    return rows.map((row) => row.child_permission_id);
  }
  async getUserPermissions(input: { platformUserId: string }): Promise<number[]> {
    const query = this.db('platform_user_permission as pup').select('pup.permission_id').where({ 'pup.platform_user_id': input.platformUserId });

    const rows = await query;
    return rows.map((row) => row.permission_id);
  }
  async getStudentIdByUserAccountId(input: { id: number }) {
    const [student] = await this.db('student as std').select('std.id').where({ 'std.user_account_id': input.id });

    return student?.id || null;
  }

  async geIdeaByStudentId(input: { id: number }) {
    const [business] = await this.db('business as bsnss').select('bsnss.idea_title').where({ 'bsnss.student_id': input.id });

    return business?.idea_title || null;
  }

  async getBusinessIdByStudentId(input: { id: number }) {
    const [business] = await this.db('business as bsnss').select('bsnss.id').where({ 'bsnss.student_id': input.id });

    return business?.id || null;
  }

  async getMarketResearchPromptData(input: { id: number }) {
    const [marketResearch] = await this.db('market_research as mr').select('mr.target_market', 'mr.market_research').where({ 'mr.id': input.id });

    return marketResearch;
  }

  async getProblemStatementById(input: { id: number }) {
    const [problemStatement] = await this.db('problem_statement as ps').select('ps.statement').where({ 'ps.id': input.id });

    return problemStatement;
  }

  async getEnrollmentStatus(input: Record<string, any>) {
    const query = this.db('enrollment_status').select('*');

    if (isDefined(input.enrollmentStatusCode)) {
      query.where({ code: input.enrollmentStatusCode });
    }
    if (isDefined(input.enrollmentStatusId)) {
      query.where({ id: input.enrollmentStatusId });
    }

    const [row] = await query;

    return row ? CommonMapper.toEnrollmentStatus(row) : null;
  }

  async getAvatars(input: Record<string, any>) {
    const [row] = await this.db('country_avatar_mapping').select('*').where({ country_id: input.countryId });
    if (!row) return null;

    return {
      group1: row.group_1,
      group2: row.group_2,
      group3: row.group_3,
      group4: row.group_4,
      fallback: {
        group1: row.fallback.group_1,
        group2: row.fallback.group_2,
        group3: row.fallback.group_3,
        group4: row.fallback.group_4,
      },
      isFallbackDefault: row.is_fallback_default,
    };
  }

  async updateCountryAvatars(input: Record<string, any>) {
    const columnsForUpdate: Record<string, string> = {
      group1: 'group_1',
      group2: 'group_2',
      group3: 'group_3',
      group4: 'group_4',
      isFallbackDefault: 'is_fallback_default',
    };

    const data: Record<string, any> = {};

    for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
      if (isDefined(input[inputKey])) {
        data[dbKey] = input[inputKey];
      }
    }

    if (!Object.keys(data).length) {
      return null;
    }

    const query = this.db('country_avatar_mapping').update(data, '*').where({ country_id: input.countryId });

    const [row] = await query;

    return {
      group1: row.group_1,
      group2: row.group_2,
      group3: row.group_3,
      group4: row.group_4,
      fallback: {
        group1: row.fallback.group_1,
        group2: row.fallback.group_2,
        group3: row.fallback.group_3,
        group4: row.fallback.group_4,
      },
      isFallbackDefault: row.is_fallback_default,
    };
  }
}
