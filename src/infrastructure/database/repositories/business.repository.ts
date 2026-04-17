import { BusinessMapper } from '@application/mappers';
import { BusinessStatus } from '@shared/enums/business-status.enum';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { applyOffsetPagination, isDefined, normalizeNumber } from '@shared/utils';
import { Knex } from 'knex';

export const completedBusinessExpression = `
  business_progress_status.problem_statement = true AND
  business_progress_status.market_research = true AND
  business_progress_status.market_fit = true AND
  business_progress_status.prototype = true AND
  business_progress_status.financial_planning = true AND
  business_progress_status.branding = true AND
  business_progress_status.marketing = true AND
  business_progress_status.revenue_model = true AND
  business_progress_status.capex = true AND
  business_progress_status.opex = true AND
  business_progress_status.business_model = true AND
  business_progress_status.pitch_script = true AND
  business_progress_status.pitch_deck = true AND
  business_progress_status.pitch_feedback = true AND
  business_progress_status.investment = true AND
  business_progress_status.launch = true
`;

export const completedInnovationExpression = `
  business_progress_status.problem_statement = true AND
  business_progress_status.market_research = true AND
  business_progress_status.market_fit = true AND
  business_progress_status.prototype = true
`;

export const completedEntrepreneurshipExpression = `
  business_progress_status.business_model = true AND
  business_progress_status.financial_planning = true AND
  business_progress_status.marketing = true AND
  business_progress_status.revenue_model = true AND
  business_progress_status.capex = true AND
  business_progress_status.opex = true AND
  business_progress_status.branding = true
`;

export const completedCommunicationExpression = `
  business_progress_status.pitch_script = true AND
  business_progress_status.pitch_deck = true AND
  business_progress_status.pitch_feedback = true
`;

export class BusinessRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async createBusiness(input: Record<string, any>) {
    const [row] = await this.db('business').insert(
      {
        business_name: input.businessName,
        ay_id: input.ayId,
        idea: input.idea,
        source: input.source,
        school_id: input.schoolId,
        student_id: input.studentId,
        challenge_id: input.challengeId,
        sdgs_text: input.sdgsText,
      },
      '*',
    );

    return {
      id: row.id,
      businessName: row.business_name,
      idea: row.idea,
      source: row.source,
      studentId: row.student_id,
      challengeId: row.challenge_id,
      academicYearId: row.ay_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  async updateBusiness(input: Record<string, any>) {
    const columnsForUpdate: Record<string, string> = {
      idea: 'idea',
      businessName: 'business_name',
      sdgsText: 'sdgs_text',
      problemStatement: 'problem_statement',
      problemStatementFeedback: 'problem_statement_feedback',
      targetMarket: 'target_market',
      marketResearch: 'market_research',
      marketResearchData: 'market_research_data',
      marketCompetitors: 'market_competitors',
      marketQuestionnaire: 'market_questionnaire',
      marketSummary: 'market_summary',
      marketFit: 'market_fit',
      marketFitFeedback: 'market_fit_feedback',
      isIdeaReviewed: 'is_idea_reviewed',
      prototypeOption: 'prototype_option',
      prototypeDescription: 'prototype_description',
      prototypeImages: 'prototype_images',

      revenueModel: 'revenue_model',
      capex: 'capex',
      capexTotal: 'capex_total',
      opex: 'opex',
      sales: 'sales',
      breakeven: 'breakeven',
      breakevenPoint: 'breakeven_point',
      financialProjectionsDescription: 'financial_plan_description',
      risksAndMitigations: 'risks_and_mitigations',
      futurePlans: 'future_plans',
      ebidta: 'ebidta',
      branding: 'branding',
      customerExperience: 'customer_experience',
      marketing: 'marketing',
      competitorAnalysis: 'competitor_analysis',
      marketingFeedback: 'marketing_feedback',

      businessModel: 'business_model',

      callToAction: 'pitch_call_to_action',

      narrative: 'pitch_narrative',
      aiGeneratedScript: 'pitch_ai_generated_script',
      pitchDescription: 'pitch_description',

      pitchPracticeVideoUrl: 'pitch_practice_video_url',
      pitchAiGeneratedFeedback: 'pitch_ai_generated_feed_back',

      launchRecommendation: 'launch_recommendation',
      investment: 'investment',
      launchStrategy: 'launch_strategy',
    };

    const data: Record<string, any> = { updated_at: input.updatedAt };
    for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
      if (isDefined(input[inputKey])) {
        data[dbKey] = input[inputKey];
      }
    }

    const query = this.db('business').update(data, '*');

    if (isDefined(input.challengeId)) {
      query.where({ challenge_id: input.challengeId });
    }
    if (isDefined(input.source)) {
      query.where({ source: input.source });
    }
    if (isDefined(input.businessId)) {
      query.where({ id: input.businessId });
    }
    if (isDefined(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }
    if (isDefined(input.studentId)) {
      query.where({ student_id: input.studentId });
    }

    const [row] = await query;

    if (!row) return null;

    return {
      id: row.id,
      businessName: row.business_name,
      idea: row.idea,
      problemStatement: row.problem_statement,
      problemStatementFeedback: row.problem_statement_feedback,
      targetMarket: row.target_market,
      marketResearch: row.market_research,
      marketResearchData: row.market_research_data,
      marketCompetitors: row.market_competitors,
      marketQuestionnaire: row.market_questionnaire,
      marketSummary: row.market_summary,
      marketFit: row.market_fit,
      isIdeaReviewed: row.is_idea_reviewed,
      marketFitFeedback: row.market_fit_feedback,
      prototypeOptions: row.prototype_option,
      prototypeDescription: row.prototype_description,
      prototypeImages: row.prototype_images,
      businessModel: row.business_model,
      branding: row.branding,
      source: row.source,
      sdgsText: row.sdgs_text,
      studentId: row.student_id,
      challengeId: row.challenge_id,
      investment: row.investment,
      launchRecommendation: row.launch_recommendation,
      launchStrategy: row.launch_strategy,
      status: row.status,
      narrative: row.pitch_narrative,
      aiGeneratedScript: row.pitch_ai_generated_script,
      pitchDescription: row.pitch_description,
      pitchPracticeVideoUrl: row.pitch_practice_video_url,
      pitchAiGeneratedFeedback: row.pitch_ai_generated_feed_back,
      callToAction: row.pitch_call_to_action,
    };
  }
  async createBusinessProgressStatus(input: Record<string, any>) {
    await this.db('business_progress_status').insert({
      business_id: input.businessId,
      school_id: input.schoolId,
      student_id: input.studentId,
    });
  }
  async createBusinessProgressScore(input: Record<string, any>) {
    await this.db('business_progress_score').insert({
      business_id: input.businessId,
      school_id: input.schoolId,
      student_id: input.studentId,
    });
  }
  async updateBusinessProgressStatus(input: Record<string, any>) {
    const columnsForUpdate: Record<string, string> = {
      problemStatementStatus: 'problem_statement',
      marketResearchStatus: 'market_research',
      marketFitStatus: 'market_fit',
      prototypeStatus: 'prototype',
      financialProjectionsStatus: 'financial_planning',
      businessModelStatus: 'business_model',
      revenueModelStatus: 'revenue_model',
      capexStatus: 'capex',
      opexStatus: 'opex',
      ebidtaStatus: 'ebidta',
      brandingStatus: 'branding',
      pitchScript: 'pitch_script',
      pitchDeck: 'pitch_deck',
      pitchFeedback: 'pitch_feedback',
      marketingStatus: 'marketing',
      launch: 'launch',
      investment: 'investment',
    };

    const setClauses: string[] = [];
    const values: any[] = [];

    setClauses.push('"updated_at" = ?');
    values.push(input.updatedAt);

    for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
      if (isDefined(input[inputKey])) {
        setClauses.push(`"${dbKey}" = ?`);
        values.push(input[inputKey]);
      }
    }

    const whereClauses: string[] = [];
    if (isDefined(input.businessId)) {
      whereClauses.push('"business_id" = ?');
      values.push(input.businessId);
    }
    if (isDefined(input.studentId)) {
      whereClauses.push('"student_id" = ?');
      values.push(input.studentId);
    }
    if (isDefined(input.schoolId)) {
      whereClauses.push('"school_id" = ?');
      values.push(input.schoolId);
    }

    const sql = `
      UPDATE business_progress_status 
      SET ${setClauses.join(', ')}
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
    `;

    await this.db.raw(sql, values);
  }
  async updateBusinessProgressScore(input: Record<string, any>) {
    const columnsForUpdate: Record<string, string> = {
      problemStatementScore: 'problem_statement',
      marketResearchScore: 'market_research',
      marketFitScore: 'market_fit',
      prototypeScore: 'prototype',
      financialProjectionsScore: 'financial_planning',
      marketPlanScore: 'marketing',
      businessModelScore: 'business_model',
      pitchFeedbackScore: 'pitch_feedback',
    };

    const setClauses: string[] = [];
    const values: any[] = [];

    setClauses.push('"updated_at" = ?');
    values.push(input.updatedAt);

    for (const [inputKey, dbKey] of Object.entries(columnsForUpdate)) {
      if (isDefined(input[inputKey])) {
        setClauses.push(`"${dbKey}" = ?`);
        values.push(input[inputKey]);
      }
    }

    const whereClauses: string[] = [];
    if (isDefined(input.businessId)) {
      whereClauses.push('"business_id" = ?');
      values.push(input.businessId);
    }
    if (isDefined(input.studentId)) {
      whereClauses.push('"student_id" = ?');
      values.push(input.studentId);
    }
    if (isDefined(input.schoolId)) {
      whereClauses.push('"school_id" = ?');
      values.push(input.schoolId);
    }

    const sql = `
      UPDATE business_progress_score 
      SET ${setClauses.join(', ')}
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
    `;

    await this.db.raw(sql, values);
  }
  async getBusinessProgressStatus(input: Record<string, any>) {
    const query = this.db('business_progress_status').select(['*']);

    if (isDefined(input.businessId)) {
      query.where({ business_id: input.businessId });
    }
    if (isDefined(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }
    if (isDefined(input.studentId)) {
      query.where({ student_id: input.studentId });
    }

    const [row] = await query;

    if (!row) return null;

    return {
      ideate: row.ideate,
      problemStatement: row.problem_statement,
      marketResearch: row.market_research,
      marketFit: row.market_fit,
      prototype: row.prototype,
      businessModel: row.business_model,
      revenueModel: row.revenue_model,
      capex: row.capex,
      opex: row.opex,
      financialProjections: row.financial_planning,
      ebitda: row.ebidta,
      branding: row.branding,
      marketing: row.marketing,
      pitchDeck: row.pitch_deck,
      pitchScript: row.pitch_script,
      pitchFeedback: row.pitch_feedback,
      investment: row.investment,
      launch: row.launch,
    };
  }

  async getBusinessStatus(input: Record<string, any>) {
    const query = this.db('business_progress_status').select(
      this.db.raw(`
        CASE
          WHEN (${completedBusinessExpression})
          THEN ${this.db.raw('?', [BusinessStatus.COMPLETED])}
          ELSE ${this.db.raw('?', [BusinessStatus.IN_PROGRESS])}
        END AS status
      `),
    );

    query.modify((qb) => {
      if (isDefined(input.businessId)) {
        qb.where({ business_id: input.businessId });
      }
      if (isDefined(input.schoolId)) {
        qb.where({ school_id: input.schoolId });
      }
      if (isDefined(input.studentId)) {
        qb.where({ student_id: input.studentId });
      }
    });

    const [row] = await query;

    return row ? row.status : BusinessStatus.IN_PROGRESS;
  }

  async getBusinessProgressScore(input: Record<string, any>) {
    const query = this.db('business_progress_score').select(['business_progress_score.*']).join('business', 'business.id', 'business_progress_score.business_id');

    if (isDefined(input.businessId)) {
      query.where({ 'business.id': input.businessId });
    }
    if (isDefined(input.schoolId)) {
      query.where({ 'business.school_id': input.schoolId });
    }
    if (isDefined(input.studentId)) {
      query.where({ 'business.student_id': input.studentId });
    }
    if (isDefined(input.academicYearId)) {
      query.where({ 'business.ay_id': input.academicYearId });
    }

    const [row] = await query;

    if (!row) return null;

    return {
      problemStatement: row.problem_statement,
      marketResearch: row.market_research,
      marketFit: row.market_fit,
      prototype: row.prototype,
      businessModel: row.business_model,
      financialProjections: row.financial_planning,
      marketing: row.marketing,
      pitchFeedback: row.pitch_feedback,
    };
  }

  async deleteBusiness(input: Record<string, any>) {
    const query = this.db('business').where({ id: input.businessId });
    console.log('input', input);

    if (isDefined(input.studentId)) {
      query.where({ student_id: input.studentId });
    }
    if (isDefined(input.schoolId)) {
      query.where({ school_id: input.schoolId });
    }
    await query.update({ deleted_at: this.db.fn.now() });
  }

  async getPrototypeOption(input: Record<string, any>) {
    const [row] = await this.db('prototype_option').select('*').where({
      is_visible: true,
      id: input.prototypeOptionId,
    });

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      prototypeCount: row.prototype_count,
    };
  }

  async getBusinesses(input: Record<string, any>) {
    const query = this.db('business').select(['business.*']).orderBy('business.created_at', 'desc');

    query.modify((qb) => {
      qb.whereNull('business.deleted_at');

      if (input.businessName) {
        const safeRegex = input.businessName.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
        const regex = `.*${safeRegex}.*`;
        qb.whereRaw(`business.business_name ~* ?`, [regex]);
      }

      if (input.schoolId) {
        qb.where({ 'business.school_id': input.schoolId });
      }

      if (input.source) {
        qb.where({ 'business.source': input.source });
      }

      if (input.studentId) {
        qb.leftJoin('enrollment', function () {
          this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
        }).leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id');

        if (isDefined(input.enrollmentStatus)) {
          qb.where('enrollment_status.code', input.enrollmentStatus);
        }

        qb.where({ 'business.student_id': input.studentId });
      }

      if (input.challengeId) {
        qb.where({ 'business.challenge_id': input.challengeId });
      }

      if (input.status) {
        qb.leftJoin('business_progress_status', 'business_progress_status.business_id', 'business.id');

        if (input.status === BusinessStatus.COMPLETED) {
          qb.whereRaw(`(${completedBusinessExpression})`);
        }

        if (input.status === BusinessStatus.IN_PROGRESS) {
          qb.whereRaw(`NOT (${completedBusinessExpression})`);
        }
      }

      if (input.countryId) {
        qb.leftJoin('school', 'school.id', 'business.school_id').where('school.country_id', input.countryId);
      }

      if (input.accountType) {
        qb.leftJoin('student', 'student.id', 'business.student_id').where({ 'student.account_type': input.accountType });
      }

      if (input.academicYearId) {
        qb.where({ 'business.ay_id': input.academicYearId });
      }
    });

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;

    return BusinessMapper.toBusinesses(rows);
  }

  async countBusinesses(input: Record<string, any>) {
    const query = this.db('business as bs')
      .leftJoin('enrollment', function () {
        this.on('enrollment.student_id', '=', 'bs.student_id').andOn('enrollment.academic_year_id', '=', 'bs.ay_id');
      })
      .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
      .count('bs.id as count');

    query.modify((qb) => {
      qb.whereNull('bs.deleted_at');
      if (input.businessName) {
        const safeRegex = input.businessName.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
        const regex = `.*${safeRegex}.*`;
        qb.whereRaw(`bs.business_name ~* ?`, [regex]);
      }

      if (input.schoolId) {
        qb.where({ 'bs.school_id': input.schoolId });
      }

      if (input.source) {
        qb.where({ 'bs.source': input.source });
      }

      if (isDefined(input.enrollmentStatus)) {
        qb.where('enrollment_status.code', input.enrollmentStatus);
      }

      if (input.studentId) {
        if (isDefined(input.enrollmentStatus)) {
          qb.where('enrollment_status.code', input.enrollmentStatus);
        }

        qb.where({ 'bs.student_id': input.studentId });
      }

      if (input.challengeId) {
        qb.where({ 'bs.challenge_id': input.challengeId });
      }

      if (input.status) {
        qb.leftJoin('business_progress_status as bps', 'bps.business_id', 'bs.id');

        switch (input.status) {
          case BusinessStatus.COMPLETED: {
            qb.andWhere((qb_1) => {
              qb_1
                .andWhere('bps.problem_statement', true)
                .andWhere('bps.market_research', true)
                .andWhere('bps.market_fit', true)
                .andWhere('bps.prototype', true)
                .andWhere('bps.financial_planning', true)
                .andWhere('bps.branding', true)
                .andWhere('bps.marketing', true)
                .andWhere('bps.revenue_model', true)
                .andWhere('bps.capex', true)
                .andWhere('bps.opex', true)
                .andWhere('bps.business_model', true)
                .andWhere('bps.pitch_script', true)
                .andWhere('bps.pitch_deck', true)
                .andWhere('bps.pitch_feedback', true)
                .andWhere('bps.investment', true)
                .andWhere('bps.launch', true);
            });
            break;
          }
          case BusinessStatus.IN_PROGRESS: {
            qb.andWhere((qb_1) => {
              qb_1
                .orWhere('bps.problem_statement', false)
                .orWhere('bps.market_research', false)
                .orWhere('bps.market_fit', false)
                .orWhere('bps.prototype', false)
                .orWhere('bps.financial_planning', false)
                .orWhere('bps.branding', false)
                .orWhere('bps.marketing', false)
                .orWhere('bps.revenue_model', false)
                .orWhere('bps.capex', false)
                .orWhere('bps.opex', false)
                .orWhere('bps.business_model', false)
                .orWhere('bps.pitch_script', false)
                .orWhere('bps.pitch_deck', false)
                .orWhere('bps.pitch_feedback', false)
                .orWhere('bps.investment', false)
                .orWhere('bps.launch', false);
            });
            break;
          }
        }
      }

      if (input.countryId) {
        qb.leftJoin('school as sch', 'sch.id', 'bs.school_id').where('sch.country_id', input.countryId);
      }

      if (input.accountType) {
        qb.leftJoin('student as std', 'std.id', 'bs.student_id').where({ 'std.account_type': input.accountType });
      }
      if (input.classAssignments && Array.isArray(input.classAssignments)) {
        if (!input.accountType) {
          qb.leftJoin('student as std', 'std.id', 'bs.student_id');
        }

        qb.where(function () {
          input.classAssignments.forEach(([gradeId, sectionId]: [number, number]) => {
            this.orWhere(function () {
              this.where('enrollment.section_id', sectionId).andWhere('enrollment.grade_id', gradeId);
            });
          });
        });
      }

      if (input.academicYearId) {
        qb.where({ 'bs.ay_id': input.academicYearId });
      }
    });

    const [{ count }] = await query;

    return parseInt(count as string, 10);
  }

  async getBusiness(input: Record<string, any>) {
    const query = this.db('business as bs').select(['bs.*']).whereNull('bs.deleted_at');

    if (isDefined(input.businessId)) {
      query.where({ 'bs.id': input.businessId });
    }
    if (isDefined(input.schoolId)) {
      query.where({ 'bs.school_id': input.schoolId });
    }
    if (isDefined(input.studentId)) {
      query.where({ 'bs.student_id': input.studentId });
    }

    const [row] = await query;

    if (!row) return null;

    return {
      id: row.id,
      businessName: row.business_name,
      idea: row.idea,
      problemStatement: row.problem_statement,
      problemStatementFeedback: row.problem_statement_feedback,
      targetMarket: row.target_market,
      marketResearch: row.market_research,
      marketResearchData: row.market_research_data,
      marketCompetitors: row.market_competitors,
      marketQuestionnaire: row.market_questionnaire,
      marketSummary: row.market_summary,
      marketFit: row.market_fit,
      isIdeaReviewed: row.is_idea_reviewed,
      marketFitFeedback: row.market_fit_feedback,
      prototypeOption: row.prototype_option,
      prototypeDescription: row.prototype_description,
      prototypeImages: row.prototype_images,
      businessModel: row.business_model,
      revenueModel: row.revenue_model,
      capex: row.capex,
      capexTotal: row.capex_total,
      opex: row.opex,
      sales: row.sales,
      breakeven: row.breakeven,
      breakevenPoint: row.breakeven_point,
      financialProjectionsDescription: row.financial_plan_description,
      risksAndMitigations: row.risks_and_mitigations,
      futurePlans: row.future_plans,
      ebidta: row.ebidta,
      branding: row.branding,
      customerExperience: row.customer_experience,
      marketing: row.marketing,
      competitorAnalysis: row.competitor_analysis,
      marketingFeedback: row.marketing_feedback,
      source: row.source,
      sdgsText: row.sdgs_text,
      studentId: row.student_id,
      challengeId: row.challenge_id,
      status: row.status,
      pitchNarrative: row.pitch_narrative,
      callToAction: row.pitch_call_to_action,
      pitchDescription: row.pitch_description,
      pitchAiGeneratedScript: row.pitch_ai_generated_script,
      pitchPracticeVideoUrl: row.pitch_practice_video_url,
      pitchAiGeneratedFeedback: row.pitch_ai_generated_feed_back,
      launchRecommendation: row.launch_recommendation,
      investment: row.investment,
      launchStrategy: row.launch_strategy,
      academicYearId: row.ay_id,
    };
  }

  async getStartupTerminologies(input: Record<string, any>) {
    const query = this.db('startup_terminologies').select('data');
    if (isDefined(input.category)) {
      query.where({ 'startup_terminologies.category': input.category });
    }

    const rows = await query;

    return rows
      .flatMap((row) => row.data)
      .map((item) => ({
        name: item.name,
        icon: item.icon,
        definition: item.definition,
        example: item.example,
      }));
  }

  async removeBusinessSdgs(input: Record<string, any>) {
    await this.db('business_sdg').del().where({
      business_id: input.businessId,
    });
  }
  async associateBusinessSdgs(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => ({
      business_id: input.businessId,
      sdg_id: input.sdgId,
    }));

    await this.db('business_sdg').insert(data);
  }

  async getBusinessModelQuestions(input: Record<string, any>) {
    const query = this.db('business_model_question').select('*');

    if (isDefined(input.isVisible)) {
      query.where({ is_visible: input.isVisible });
    }
    if (isDefined(input.questionIds)) {
      query.whereIn('id', input.questionIds);
    }

    const rows = await query;

    return rows.map((row) => ({
      id: row.id,
      question: row.question,
      iconUrl: row.icon_url,
    }));
  }

  async getBusinessSdgs(input: Record<string, any>) {
    const rows = await this.db('business_sdg as bsd').join('sdg', 'bsd.sdg_id', 'sdg.id').select(['sdg.*']).where('bsd.business_id', input.businessId);

    return rows.map((row) => ({ id: row.id, title: row.title, description: row.description, createdAt: row.created_at, updatedAt: row.updated_at }));
  }

  async getBusinessStatsByStudentId(input: Record<string, any>) {
    const [row] = await this.db('business')
      .leftJoin('business_progress_status', 'business_progress_status.business_id', 'business.id')
      .modify((qb) => {
        if (isDefined(input.studentId)) {
          qb.where('business.student_id', input.studentId);
        }
        if (isDefined(input.schoolId)) {
          qb.where('business.school_id', input.schoolId);
        }
        if (isDefined(input.academicYearId)) {
          qb.where('business.ay_id', input.academicYearId);
        }
      })
      .whereNull('business.deleted_at')
      .select([
        this.db.raw('COUNT(DISTINCT business.id) AS total'),
        this.db.raw(`
          SUM(
            CASE
              WHEN (${completedBusinessExpression})
              THEN 1 ELSE 0
            END
          ) AS completed
        `),
        this.db.raw(`
          SUM(
            CASE
              WHEN NOT (${completedBusinessExpression})
              THEN 1 ELSE 0
            END
          ) AS in_progress
        `),
      ]);
    return {
      total: Number(row?.total ?? 0),
      completed: Number(row?.completed ?? 0),
      inProgress: Number(row?.in_progress ?? 0),
    };
  }

  async findCurrencyById(currencyId: number) {
    const row = await this.db('currency').select(['id', 'code', 'name']).where({ id: currencyId }).first();

    return row ? { id: row.id, code: row.code, name: row.name } : null;
  }

  async getRevenueModelsByUserId(input: { userId: string }): Promise<
    {
      id: number;
      currencyId: number;
      description: string;
      averageCostPerCustomerPerMonth: number;
    }[]
  > {
    const rows = await this.db('revenue_model')
      .select(['id', 'currency_id as currencyId', 'description', 'average_cost_per_customer_per_month as averageCostPerCustomerPerMonth'])
      .where({ user_id: input.userId });

    return rows.map((row) => ({
      id: row.id,
      currencyId: row.currencyId,
      description: row.description,
      averageCostPerCustomerPerMonth: row.averageCostPerCustomerPerMonth,
    }));
  }

  async getUniqueBusinessCount(input: Record<string, any>) {
    const query = this.db('business as b')
      .leftJoin('enrollment as enr', function () {
        this.on('enr.student_id', '=', 'b.student_id').andOn('enr.academic_year_id', '=', 'b.ay_id');
      })
      .leftJoin('enrollment_status as enrs', 'enr.enrollment_status_id', 'enrs.id')
      .select('enr.school_id', 'enr.grade_id', 'enr.section_id')
      .groupBy('enr.school_id', 'enr.grade_id', 'enr.section_id')
      .countDistinct({
        unique_business_count: this.db.raw('LOWER(TRIM(b.business_name))'),
      })
      .whereNull('b.deleted_at');

    query.modify((qb) => {
      if (input.schoolId) {
        qb.where('enr.school_id', input.schoolId);

        // Handle teacher's class assignments
        if (input.classAssignments && input.classAssignments.length > 0) {
          qb.where(function () {
            input.classAssignments.forEach(([gradeId, sectionId]) => {
              this.orWhere(function () {
                this.where('enr.section_id', sectionId).where('enr.grade_id', gradeId);
              });
            });
          });
        } else if (input.gradeId) {
          // For non-teacher users with specific grade/section filters
          qb.where('enr.grade_id', input.gradeId);

          if (input.sectionId) {
            qb.where('enr.section_id', input.sectionId);
          }
        }
      }

      if (input.academicYearId) {
        qb.where({ 'enr.academic_year_id': input.academicYearId });
      }

      if (input.enrollmentStatus) {
        qb.where('enrs.code', input.enrollmentStatus);
      }

      if (input.countryId || input.accountType) {
        qb.leftJoin('school as sch', 'sch.id', 'enr.school_id');

        if (input.countryId) {
          qb.where('sch.country_id', input.countryId);
        }

        if (input.accountType) {
          qb.where({ 'sch.account_type': input.accountType });
        }
      }
    });

    const rows = await query;

    return BusinessMapper.totalUniqueBusinessCount(rows);
  }

  async getBusinessModel(input: Record<string, any>) {
    const query = this.db('business as b').select('b.business_model');

    if (isDefined(input.businessId)) {
      query.where('b.id', input.businessId);
    }
    const row = await query.first();
    return { businessModel: row.business_model };
  }

  async getBusinessesAverageScores(input: Record<string, any>) {
    const query = this.db
      .with('per_business', (qb) => {
        qb.from('business')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .leftJoin('business_progress_score', 'business_progress_score.business_id', 'business.id')
          .leftJoin('business_progress_status', 'business_progress_status.business_id', 'business.id')
          .leftJoin('student', 'student.id', 'business.student_id')
          .leftJoin('school', 'school.id', 'business.school_id')
          .whereNull('business.deleted_at')
          .modify((qb) => {
            if (input.schoolId) qb.where('business.school_id', input.schoolId);
            if (input.studentId) qb.where('business.student_id', input.studentId);
            if (input.businessId) qb.where('business.id', input.businessId);
            if (input.countryId) qb.where('school.country_id', input.countryId);
            if (input.accountType) qb.where('student.account_type', input.accountType);
            if (input.academicYearId) qb.where('business.ay_id', input.academicYearId);
            if (input.enrollmentStatus) qb.where('enrollment_status.code', input.enrollmentStatus);
            if (input.classAssignments?.length) {
              qb.where(function () {
                input.classAssignments.forEach(([gradeId, sectionId]) => {
                  this.orWhere(function () {
                    this.where('enrollment.section_id', sectionId).andWhere('enrollment.grade_id', gradeId);
                  });
                });
              });
            }
          })
          .select([
            'business.id as business_id',
            this.db.raw(`
              CASE
                WHEN ${completedInnovationExpression}
                THEN (
                  COALESCE(business_progress_score.problem_statement, 0) +
                  COALESCE(business_progress_score.market_research, 0) +
                  COALESCE(business_progress_score.market_fit, 0) +
                  COALESCE(business_progress_score.prototype, 0)
                ) / 4.0
                ELSE 0
              END AS i_score
            `),
            this.db.raw(`
              CASE
                WHEN ${completedEntrepreneurshipExpression}
                THEN (
                  COALESCE(business_progress_score.business_model, 0) +
                  COALESCE(business_progress_score.financial_planning, 0) +
                  COALESCE(business_progress_score.marketing, 0)
                ) / 3.0
                ELSE 0
              END AS e_score
            `),
            this.db.raw(`
              CASE
                WHEN ${completedCommunicationExpression}
                THEN COALESCE(business_progress_score.pitch_feedback, 0)
                ELSE 0
              END AS c_score
            `),
          ]);
      })
      .from('per_business')
      .select([
        this.db.raw('COALESCE(AVG(i_score), 0) AS avg_i_score'),
        this.db.raw('COALESCE(AVG(e_score), 0) AS avg_e_score'),
        this.db.raw('COALESCE(AVG(c_score), 0) AS avg_c_score'),
      ]);

    const [row] = await query;

    return BusinessMapper.toBusinessesAverageScores(row);
  }

  async getTotalAverageScore(input: Record<string, any>) {
    const row = await this.db('business')
      .leftJoin('business_progress_score', 'business_progress_score.business_id', 'business.id')
      .leftJoin('business_progress_status', 'business_progress_status.business_id', 'business.id')
      .leftJoin('enrollment', function () {
        this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
      })
      .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
      .where('business.student_id', input.studentId)
      .whereNull('business.deleted_at')
      .modify((query) => {
        if (input.status === BusinessStatus.COMPLETED) {
          query.whereRaw(completedBusinessExpression);
        }
        if (input.status === BusinessStatus.IN_PROGRESS) {
          query.whereRaw(`NOT (${completedBusinessExpression})`);
        }
        if (isDefined(input.academicYearId)) {
          query.where('business.ay_id', input.academicYearId);
        }
        if (isDefined(input.schoolId)) {
          query.where('business.school_id', input.schoolId);
        }
        if (isDefined(input.enrollmentStatus)) {
          query.where('enrollment_status.code', input.enrollmentStatus);
        }
      })
      .select(
        this.db.raw(`
        COUNT(business.id) AS business_count
      `),

        this.db.raw(`
        SUM(
          CASE 
            WHEN ${completedInnovationExpression}
            THEN (business_progress_score.problem_statement + business_progress_score.market_research + business_progress_score.market_fit + business_progress_score.prototype) / 4.0
            ELSE 0
          END
        ) AS i_total
      `),

        this.db.raw(`
        SUM(
          CASE 
            WHEN ${completedEntrepreneurshipExpression}
            THEN (business_progress_score.business_model + business_progress_score.financial_planning + business_progress_score.marketing) / 3.0
            ELSE 0
          END
        ) AS e_total
      `),

        this.db.raw(`
        SUM(
          CASE 
            WHEN ${completedCommunicationExpression}
            THEN business_progress_score.pitch_feedback
            ELSE 0
          END
        ) AS c_total
      `),
      )
      .first();

    const businessCount = Number(row?.business_count) || 0;

    if (businessCount === 0) {
      return { totalAvgScore: null };
    }

    const avgInnovation = Number(row.i_total) / businessCount;
    const avgExecution = Number(row.e_total) / businessCount;
    const avgCommunication = Number(row.c_total) / businessCount;

    const totalAvgScore = (avgInnovation + avgExecution + avgCommunication) / 3.0;

    return {
      totalAvgScore,
    };
  }

  async getBusinessAverageScore(input: Record<string, any>) {
    const query = this.db('business_progress_score as bps')
      .join('business_progress_status as bpst', 'bpst.business_id', 'bps.business_id')
      .join('business as b', 'bps.business_id', 'b.id')
      .whereNull('b.deleted_at');

    if (isDefined(input.studentId)) {
      query.where('b.student_id', input.studentId);
    }

    if (isDefined(input.schoolId)) {
      query.where('b.school_id', input.schoolId);
    }

    if (isDefined(input.businessId)) {
      query.where('b.id', input.businessId);
    }

    if (isDefined(input.academicYearId)) {
      query.where('b.ay_id', input.academicYearId);
    }

    if (isDefined(input.gradeId)) {
      query.where('b.grade_id', input.gradeId);
    }

    if (isDefined(input.sectionId)) {
      query.where('b.section_id', input.sectionId);
    }

    const [row] = await query.select(
      this.db.raw(`
        AVG(
          (bps.problem_statement + bps.market_research + bps.market_fit + bps.prototype) / 4.0
        ) FILTER (
          WHERE bpst.prototype = true
            AND bps.problem_statement IS NOT NULL
            AND bps.market_research IS NOT NULL
            AND bps.market_fit IS NOT NULL
            AND bps.prototype IS NOT NULL
        ) AS avg_i
      `),

      this.db.raw(`
        AVG(
          (bps.business_model + bps.financial_planning + bps.marketing) / 3.0
        ) FILTER (
          WHERE bpst.marketing = true
            AND bps.business_model IS NOT NULL
            AND bps.financial_planning IS NOT NULL
            AND bps.marketing IS NOT NULL
        ) AS avg_e
      `),

      this.db.raw(`
        AVG(bps.pitch_feedback)
        FILTER (
          WHERE bpst.pitch_feedback IS NOT NULL
            AND bps.pitch_feedback IS NOT NULL
        ) AS avg_c
      `),
    );

    if (!row) {
      return {
        averageIScore: null,
        averageEScore: null,
        averageCScore: null,
        averageScore: null,
      };
    }

    const businessAverageScore = (normalizeNumber(row.avg_i) + normalizeNumber(row.avg_e) + normalizeNumber(row.avg_c)) / 3.0;

    return {
      averageIScore: normalizeNumber(row.avg_i),
      averageEScore: normalizeNumber(row.avg_e),
      averageCScore: normalizeNumber(row.avg_c),
      averageScore: businessAverageScore,
    };
  }

  async getOverallBusinessReport(input: Record<string, any>) {
    return this.db
      .with('per_business', (qb) => {
        qb.from('business')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .leftJoin('business_progress_score', 'business_progress_score.business_id', 'business.id')
          .leftJoin('business_progress_status', 'business_progress_status.business_id', 'business_progress_score.business_id')
          .modify((query) => {
            if (isDefined(input.schoolId)) {
              query.where({ 'business.school_id': input.schoolId });
            }
            if (isDefined(input.studentId)) {
              query.where({ 'business.student_id': input.studentId });
            }
            if (isDefined(input.academicYearId)) {
              query.where({ 'business.ay_id': input.academicYearId });
            }
            if (isDefined(input.enrollmentStatus)) {
              query.where('enrollment_status.code', input.enrollmentStatus);
            }
          })
          .whereNull('business.deleted_at')
          .groupBy('business.id')
          .select([
            this.db.raw(`
              AVG(
                (business_progress_score.problem_statement +
                business_progress_score.market_research +
                business_progress_score.market_fit +
                business_progress_score.prototype) / 4.0
              ) FILTER (
                WHERE ${completedInnovationExpression}
              ) AS i_score
            `),
            this.db.raw(`
              AVG(
                (business_progress_score.business_model +
                business_progress_score.financial_planning +
                business_progress_score.marketing) / 3.0
              ) FILTER (
                WHERE ${completedEntrepreneurshipExpression}
              ) AS e_score
            `),
            this.db.raw(`
              AVG(business_progress_score.pitch_feedback)
              FILTER (WHERE ${completedCommunicationExpression}) AS c_score
            `),
          ]);
      })
      .from('per_business')
      .select([
        this.db.raw('COALESCE(MAX(i_score), 0) AS high_i'),
        this.db.raw('COALESCE(MIN(i_score), 0) AS low_i'),
        this.db.raw('COALESCE(AVG(i_score), 0) AS avg_i'),

        this.db.raw('COALESCE(MAX(e_score), 0) AS high_e'),
        this.db.raw('COALESCE(MIN(e_score), 0) AS low_e'),
        this.db.raw('COALESCE(AVG(e_score), 0) AS avg_e'),
        this.db.raw('COALESCE(MAX(c_score), 0) AS high_c'),
        this.db.raw('COALESCE(MIN(c_score), 0) AS low_c'),
        this.db.raw('COALESCE(AVG(c_score), 0) AS avg_c'),

        this.db.raw('COALESCE(MAX(i_score), 0) - COALESCE(MIN(i_score), 0) AS impact_i'),
        this.db.raw('COALESCE(MAX(e_score), 0) - COALESCE(MIN(e_score), 0) AS impact_e'),
        this.db.raw('COALESCE(MAX(c_score), 0) - COALESCE(MIN(c_score), 0) AS impact_c'),
      ])
      .first();
  }

  applyBusinessFilters(query: Knex.QueryBuilder, input: Record<string, any>) {
    if (isDefined(input.businessName)) {
      const safeRegex = input.businessName.replace(/([.*+?^=!:${}()|[\]\\/])/g, '\\$1');
      const regex = `.*${safeRegex}.*`;
      query.whereRaw(`bs.business_name ~* ?`, [regex]);
    }
    if (isDefined(input.schoolId)) {
      query.where({ 'bs.school_id': input.schoolId });
    }
    if (isDefined(input.source)) {
      query.where({ 'bs.source': input.source });
    }
    if (isDefined(input.studentId)) {
      query.where({ 'bs.student_id': input.studentId });
    }
    if (isDefined(input.challengeId)) {
      query.where({ 'bs.challenge_id': input.challengeId });
    }
    if (isDefined(input.status)) {
      query.join('business_progress_status as bps', 'bps.business_id', 'bs.id');

      switch (input.status) {
        case BusinessStatus.COMPLETED: {
          query.andWhere((qb) => {
            qb.andWhere('bps.problem_statement', true).andWhere('bps.market_research', true).andWhere('bps.market_fit', true).andWhere('bps.prototype', true);
          });
          break;
        }

        case BusinessStatus.IN_PROGRESS: {
          query.andWhere((qb) => {
            qb.orWhere('bps.problem_statement', false).orWhere('bps.market_research', false).orWhere('bps.market_fit', false).orWhere('bps.prototype', false);
          });
          break;
        }
      }
    }
    if (input.country) {
      query.join('school as sch', 'sch.id', 'bs.school_id').where('sch.country_id', input.country);
    }

    if (input.accountType) {
      query.join('student as std', 'std.id', 'bs.student_id').where({ 'std.account_type': input.accountType });
    }
  }

  async getAllSteps() {
    return await this.db('business_learning_step').select(['id', 'name', 'sort_order as sortOrder', 'business_learning_phase_id as phaseId', 'code']);
  }

  async getOverallSectionScore(input: Record<string, any>) {
    const row = await this.db
      .with('raw_business_score', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((query) => {
            if (input.status === 'completed') {
              query.whereRaw(completedBusinessExpression);
            }

            if (input.status === 'in_progress') {
              query.whereRaw(`NOT (${completedBusinessExpression})`);
            }
          })
          .select([
            'business.student_id',
            this.db.raw(`
            (
              (CASE WHEN ${completedInnovationExpression}
                THEN (business_progress_score.problem_statement
                    + business_progress_score.market_research
                    + business_progress_score.market_fit
                    + business_progress_score.prototype) / 4.0
                ELSE 0 END)
              +
              (CASE WHEN ${completedEntrepreneurshipExpression}
                THEN (business_progress_score.business_model
                    + business_progress_score.financial_planning
                    + business_progress_score.marketing) / 3.0
                ELSE 0 END)
              +
              (CASE WHEN ${completedCommunicationExpression}
                THEN business_progress_score.pitch_feedback
                ELSE 0 END)
            ) / 3.0 AS total_score
          `),
          ]);
      })
      .with('student_top', (qb) => {
        qb.from('enrollment')
          .leftJoin('raw_business_score', 'raw_business_score.student_id', 'enrollment.student_id')
          .where({
            'enrollment.school_id': input.schoolId,
            'enrollment.grade_id': input.gradeId,
            'enrollment.section_id': input.sectionId,
            'enrollment.enrollment_status_id': 1,
          })
          .groupBy('enrollment.student_id', 'enrollment.grade_id', 'enrollment.section_id')
          .select(this.db.raw('COALESCE(MAX(raw_business_score.total_score), 0) AS top_score'));
      })
      .select(this.db.raw('AVG(top_score) AS ocs'))
      .from('student_top')
      .first();

    return row ? row.ocs : null;
  }

  async getSectionPerformanceScores(input: Record<string, any>) {
    const row = await this.db
      .with('raw_scores', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((query) => {
            if (input.status === 'completed') {
              query.whereRaw(completedBusinessExpression);
            }

            if (input.status === 'in_progress') {
              query.whereRaw(`NOT (${completedBusinessExpression})`);
            }
          })
          .select([
            'business.student_id',

            this.db.raw(`
            CASE WHEN business_progress_status.prototype = true
              AND business_progress_score.problem_statement IS NOT NULL
              AND business_progress_score.market_research IS NOT NULL
              AND business_progress_score.market_fit IS NOT NULL
              AND business_progress_score.prototype IS NOT NULL
            THEN (
              business_progress_score.problem_statement +
              business_progress_score.market_research +
              business_progress_score.market_fit +
              business_progress_score.prototype
            ) / 4.0
            ELSE 0 END AS cis
          `),

            this.db.raw(`
            CASE WHEN business_progress_status.marketing = true
              AND business_progress_score.business_model IS NOT NULL
              AND business_progress_score.financial_planning IS NOT NULL
              AND business_progress_score.marketing IS NOT NULL
            THEN (
              business_progress_score.business_model +
              business_progress_score.financial_planning +
              business_progress_score.marketing
            ) / 3.0
            ELSE 0 END AS ces
          `),

            this.db.raw(`
            CASE WHEN business_progress_status.pitch_feedback = true
              AND business_progress_score.pitch_feedback IS NOT NULL
            THEN business_progress_score.pitch_feedback
            ELSE 0 END AS ccs
          `),
          ]);
      })

      .with('student_avg', (qb) => {
        qb.from('enrollment')
          .leftJoin('raw_scores', 'raw_scores.student_id', 'enrollment.student_id')
          .where({
            'enrollment.school_id': input.schoolId,
            'enrollment.grade_id': input.gradeId,
            'enrollment.section_id': input.sectionId,
            'enrollment.enrollment_status_id': 1,
          })
          .groupBy('enrollment.student_id')
          .select([this.db.raw('COALESCE(AVG(cis), 0) AS cis'), this.db.raw('COALESCE(AVG(ces), 0) AS ces'), this.db.raw('COALESCE(AVG(ccs), 0) AS ccs')]);
      })

      .select([this.db.raw('COALESCE(AVG(cis), 0) AS cis'), this.db.raw('COALESCE(AVG(ces), 0) AS ces'), this.db.raw('COALESCE(AVG(ccs), 0) AS ccs')])
      .from('student_avg')
      .first();

    return row ?? { cis: 0, ces: 0, ccs: 0 };
  }

  async getSectionPerformanceProgression(input: Record<string, any>) {
    const row = await this.db
      .with('raw_step_scores', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((query) => {
            if (input.status === 'completed') {
              query.whereRaw(completedBusinessExpression);
            }

            if (input.status === 'in_progress') {
              query.whereRaw(`NOT (${completedBusinessExpression})`);
            }
          })
          .select([
            'business.student_id',

            this.db.raw(`COALESCE(business_progress_score.problem_statement, 0) AS problem_statement`),
            this.db.raw(`COALESCE(business_progress_score.market_research, 0) AS market_research`),
            this.db.raw(`COALESCE(business_progress_score.market_fit, 0) AS market_fit`),
            this.db.raw(`COALESCE(business_progress_score.prototype, 0) AS prototype`),

            this.db.raw(`COALESCE(business_progress_score.business_model, 0) AS business_model`),
            this.db.raw(`COALESCE(business_progress_score.financial_planning, 0) AS financial_planning`),
            this.db.raw(`COALESCE(business_progress_score.marketing, 0) AS marketing`),

            this.db.raw(`COALESCE(business_progress_score.pitch_feedback, 0) AS pitch_feedback`),
          ]);
      })
      .with('student_avg', (qb) => {
        qb.from('enrollment')
          .leftJoin('raw_step_scores', 'raw_step_scores.student_id', 'enrollment.student_id')
          .where({
            'enrollment.school_id': input.schoolId,
            'enrollment.grade_id': input.gradeId,
            'enrollment.section_id': input.sectionId,
            'enrollment.enrollment_status_id': 1,
          })
          .groupBy('enrollment.student_id')
          .select([
            this.db.raw('COALESCE(AVG(problem_statement), 0) AS problem_statement'),
            this.db.raw('COALESCE(AVG(market_research), 0) AS market_research'),
            this.db.raw('COALESCE(AVG(market_fit), 0) AS market_fit'),
            this.db.raw('COALESCE(AVG(prototype), 0) AS prototype'),

            this.db.raw('COALESCE(AVG(business_model), 0) AS business_model'),
            this.db.raw('COALESCE(AVG(financial_planning), 0) AS financial_planning'),
            this.db.raw('COALESCE(AVG(marketing), 0) AS marketing'),

            this.db.raw('COALESCE(AVG(pitch_feedback), 0) AS pitch_feedback'),
          ]);
      })
      .select([
        this.db.raw('COALESCE(AVG(problem_statement), 0) AS problem_statement'),
        this.db.raw('COALESCE(AVG(market_research), 0) AS market_research'),
        this.db.raw('COALESCE(AVG(market_fit), 0) AS market_fit'),
        this.db.raw('COALESCE(AVG(prototype), 0) AS prototype'),

        this.db.raw('COALESCE(AVG(business_model), 0) AS business_model'),
        this.db.raw('COALESCE(AVG(financial_planning), 0) AS financial_planning'),
        this.db.raw('COALESCE(AVG(marketing), 0) AS marketing'),

        this.db.raw('COALESCE(AVG(pitch_feedback), 0) AS pitch_feedback'),
      ])
      .from('student_avg')
      .first();

    if (!row) return null;

    return {
      problemStatement: row.problem_statement,
      marketResearch: row.market_research,
      marketFit: row.market_fit,
      prototype: row.prototype,

      businessModel: row.business_model,
      financialPlanning: row.financial_planning,
      marketing: row.marketing,

      pitchFeedback: row.pitch_feedback,
    };
  }

  async getGradePerformanceProgression(input: Record<string, any>) {
    const row = await this.db

      // LEVEL 1: Business → raw step scores
      .with('raw_step_scores', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((query) => {
            if (input.status === 'completed') {
              query.whereRaw(completedBusinessExpression);
            }

            if (input.status === 'in_progress') {
              query.whereRaw(`NOT (${completedBusinessExpression})`);
            }
          })
          .select([
            'business.student_id',

            this.db.raw('COALESCE(business_progress_score.problem_statement, 0) AS problem_statement'),
            this.db.raw('COALESCE(business_progress_score.market_research, 0) AS market_research'),
            this.db.raw('COALESCE(business_progress_score.market_fit, 0) AS market_fit'),
            this.db.raw('COALESCE(business_progress_score.prototype, 0) AS prototype'),

            this.db.raw('COALESCE(business_progress_score.business_model, 0) AS business_model'),
            this.db.raw('COALESCE(business_progress_score.financial_planning, 0) AS financial_planning'),
            this.db.raw('COALESCE(business_progress_score.marketing, 0) AS marketing'),

            this.db.raw('COALESCE(business_progress_score.pitch_feedback, 0) AS pitch_feedback'),
          ]);
      })

      // LEVEL 2: Student → student_avg (per section)
      .with('student_avg', (qb) => {
        qb.from('enrollment').leftJoin('raw_step_scores', 'raw_step_scores.student_id', 'enrollment.student_id').where({
          'enrollment.school_id': input.schoolId,
          'enrollment.grade_id': input.gradeId,
          'enrollment.enrollment_status_id': 1,
        });

        if (input.sectionIds?.length) {
          qb.whereIn('enrollment.section_id', input.sectionIds);
        }

        qb.groupBy('enrollment.student_id', 'enrollment.section_id').select([
          'enrollment.section_id',

          this.db.raw('AVG(problem_statement) AS problem_statement'),
          this.db.raw('AVG(market_research) AS market_research'),
          this.db.raw('AVG(market_fit) AS market_fit'),
          this.db.raw('AVG(prototype) AS prototype'),

          this.db.raw('AVG(business_model) AS business_model'),
          this.db.raw('AVG(financial_planning) AS financial_planning'),
          this.db.raw('AVG(marketing) AS marketing'),

          this.db.raw('AVG(pitch_feedback) AS pitch_feedback'),
        ]);
      })

      // LEVEL 3: Section → SUM students + COUNT students
      .with('section_sum', (qb) => {
        qb.from('student_avg')
          .groupBy('section_id')
          .select([
            this.db.raw('SUM(problem_statement) AS problem_statement'),
            this.db.raw('SUM(market_research) AS market_research'),
            this.db.raw('SUM(market_fit) AS market_fit'),
            this.db.raw('SUM(prototype) AS prototype'),

            this.db.raw('SUM(business_model) AS business_model'),
            this.db.raw('SUM(financial_planning) AS financial_planning'),
            this.db.raw('SUM(marketing) AS marketing'),

            this.db.raw('SUM(pitch_feedback) AS pitch_feedback'),
            this.db.raw('COUNT(*) AS student_count'),
          ]);
      })

      // LEVEL 4: Grade → weighted average
      .select([
        this.db.raw('SUM(problem_statement) / NULLIF(SUM(student_count), 0) AS problem_statement'),
        this.db.raw('SUM(market_research) / NULLIF(SUM(student_count), 0) AS market_research'),
        this.db.raw('SUM(market_fit) / NULLIF(SUM(student_count), 0) AS market_fit'),
        this.db.raw('SUM(prototype) / NULLIF(SUM(student_count), 0) AS prototype'),

        this.db.raw('SUM(business_model) / NULLIF(SUM(student_count), 0) AS business_model'),
        this.db.raw('SUM(financial_planning) / NULLIF(SUM(student_count), 0) AS financial_planning'),
        this.db.raw('SUM(marketing) / NULLIF(SUM(student_count), 0) AS marketing'),

        this.db.raw('SUM(pitch_feedback) / NULLIF(SUM(student_count), 0) AS pitch_feedback'),
      ])
      .from('section_sum')
      .first();

    return {
      problemStatement: row.problem_statement ?? 0,
      marketResearch: row.market_research ?? 0,
      marketFit: row.market_fit ?? 0,
      prototype: row.prototype ?? 0,
      businessModel: row.business_model ?? 0,
      financialPlanning: row.financial_planning ?? 0,
      marketing: row.marketing ?? 0,
      pitchFeedback: row.pitch_feedback ?? 0,
    };
  }

  async getSchoolPerformanceProgression(input: Record<string, any>) {
    const row = await this.db

      // 1️⃣ Business → raw step scores
      .with('raw_step_scores', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((query) => {
            if (input.status === 'completed') {
              query.whereRaw(completedBusinessExpression);
            }
            if (input.status === 'in_progress') {
              query.whereRaw(`NOT (${completedBusinessExpression})`);
            }
          })
          .select([
            'business.student_id',

            this.db.raw('COALESCE(business_progress_score.problem_statement, 0) AS problem_statement'),
            this.db.raw('COALESCE(business_progress_score.market_research, 0) AS market_research'),
            this.db.raw('COALESCE(business_progress_score.market_fit, 0) AS market_fit'),
            this.db.raw('COALESCE(business_progress_score.prototype, 0) AS prototype'),

            this.db.raw('COALESCE(business_progress_score.business_model, 0) AS business_model'),
            this.db.raw('COALESCE(business_progress_score.financial_planning, 0) AS financial_planning'),
            this.db.raw('COALESCE(business_progress_score.marketing, 0) AS marketing'),

            this.db.raw('COALESCE(business_progress_score.pitch_feedback, 0) AS pitch_feedback'),
          ]);
      })

      // 2️⃣ Student → AVG per student
      .with('student_avg', (qb) => {
        qb.from('enrollment')
          .leftJoin('raw_step_scores', 'raw_step_scores.student_id', 'enrollment.student_id')
          .where({
            'enrollment.school_id': input.schoolId,
            'enrollment.enrollment_status_id': 1,
          })
          .modify((query) => {
            if (input.gradeIds?.length) {
              query.whereIn('enrollment.grade_id', input.gradeIds);
            }
          })
          .groupBy('enrollment.student_id', 'enrollment.grade_id', 'enrollment.section_id')
          .select([
            'enrollment.grade_id',
            'enrollment.section_id',

            this.db.raw('AVG(problem_statement) AS problem_statement'),
            this.db.raw('AVG(market_research) AS market_research'),
            this.db.raw('AVG(market_fit) AS market_fit'),
            this.db.raw('AVG(prototype) AS prototype'),

            this.db.raw('AVG(business_model) AS business_model'),
            this.db.raw('AVG(financial_planning) AS financial_planning'),
            this.db.raw('AVG(marketing) AS marketing'),

            this.db.raw('AVG(pitch_feedback) AS pitch_feedback'),
          ]);
      })

      // 3️⃣ Section → SUM students + COUNT students
      .with('section_sum', (qb) => {
        qb.from('student_avg')
          .groupBy('grade_id', 'section_id')
          .select([
            'grade_id',

            this.db.raw('SUM(problem_statement) AS problem_statement'),
            this.db.raw('SUM(market_research) AS market_research'),
            this.db.raw('SUM(market_fit) AS market_fit'),
            this.db.raw('SUM(prototype) AS prototype'),

            this.db.raw('SUM(business_model) AS business_model'),
            this.db.raw('SUM(financial_planning) AS financial_planning'),
            this.db.raw('SUM(marketing) AS marketing'),

            this.db.raw('SUM(pitch_feedback) AS pitch_feedback'),
            this.db.raw('COUNT(*) AS student_count'),
          ]);
      })

      // 4️⃣ Grade → SUM sections, SUM students
      .with('grade_sum', (qb) => {
        qb.from('section_sum')
          .groupBy('grade_id')
          .select([
            this.db.raw('SUM(problem_statement) AS problem_statement'),
            this.db.raw('SUM(market_research) AS market_research'),
            this.db.raw('SUM(market_fit) AS market_fit'),
            this.db.raw('SUM(prototype) AS prototype'),

            this.db.raw('SUM(business_model) AS business_model'),
            this.db.raw('SUM(financial_planning) AS financial_planning'),
            this.db.raw('SUM(marketing) AS marketing'),

            this.db.raw('SUM(pitch_feedback) AS pitch_feedback'),
            this.db.raw('SUM(student_count) AS student_count'),
          ]);
      })

      // 5️⃣ School → weighted AVG by students
      .select([
        this.db.raw('SUM(problem_statement) / NULLIF(SUM(student_count), 0) AS problem_statement'),
        this.db.raw('SUM(market_research) / NULLIF(SUM(student_count), 0) AS market_research'),
        this.db.raw('SUM(market_fit) / NULLIF(SUM(student_count), 0) AS market_fit'),
        this.db.raw('SUM(prototype) / NULLIF(SUM(student_count), 0) AS prototype'),

        this.db.raw('SUM(business_model) / NULLIF(SUM(student_count), 0) AS business_model'),
        this.db.raw('SUM(financial_planning) / NULLIF(SUM(student_count), 0) AS financial_planning'),
        this.db.raw('SUM(marketing) / NULLIF(SUM(student_count), 0) AS marketing'),

        this.db.raw('SUM(pitch_feedback) / NULLIF(SUM(student_count), 0) AS pitch_feedback'),
      ])
      .from('grade_sum')
      .first();

    return {
      problemStatement: row?.problem_statement ?? 0,
      marketResearch: row?.market_research ?? 0,
      marketFit: row?.market_fit ?? 0,
      prototype: row?.prototype ?? 0,

      businessModel: row?.business_model ?? 0,
      financialPlanning: row?.financial_planning ?? 0,
      marketing: row?.marketing ?? 0,

      pitchFeedback: row?.pitch_feedback ?? 0,
    };
  }

  async getOverallGradeScore(input: Record<string, any>) {
    const row = await this.db
      .with('raw_business_score', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((query) => {
            if (input.status === 'completed') {
              query.whereRaw(completedBusinessExpression);
            }

            if (input.status === 'in_progress') {
              query.whereRaw(`NOT (${completedBusinessExpression})`);
            }
          })
          .select([
            'business.student_id',
            this.db.raw(`
            (
              (CASE WHEN ${completedInnovationExpression}
                THEN (business_progress_score.problem_statement
                    + business_progress_score.market_research
                    + business_progress_score.market_fit
                    + business_progress_score.prototype) / 4.0
                ELSE 0 END)
              +
              (CASE WHEN ${completedEntrepreneurshipExpression}
                THEN (business_progress_score.business_model
                    + business_progress_score.financial_planning
                    + business_progress_score.marketing) / 3.0
                ELSE 0 END)
              +
              (CASE WHEN ${completedCommunicationExpression}
                THEN business_progress_score.pitch_feedback
                ELSE 0 END)
            ) / 3.0 AS total_score
          `),
          ]);
      })
      .with('student_top', (qb) => {
        qb.from('enrollment')
          .leftJoin('raw_business_score', 'raw_business_score.student_id', 'enrollment.student_id')
          .where({
            'enrollment.school_id': input.schoolId,
            'enrollment.grade_id': input.gradeId,
            'enrollment.enrollment_status_id': 1,
          })
          .groupBy('enrollment.student_id', 'enrollment.grade_id', 'enrollment.section_id')
          .select(['enrollment.grade_id', 'enrollment.section_id', this.db.raw('COALESCE(MAX(raw_business_score.total_score), 0) AS top_score')]);
      })
      .with('section_average', (qb) => {
        qb.from('school_section')
          .leftJoin('student_top', function () {
            this.on('student_top.section_id', '=', 'school_section.section_id').andOn('student_top.grade_id', '=', 'school_section.grade_id');
          })
          .where({
            'school_section.school_id': input.schoolId,
            'school_section.grade_id': input.gradeId,
          })
          .modify((query) => {
            if (input.sectionIds?.length) {
              query.whereIn('school_section.section_id', input.sectionIds);
            }
          })
          .groupBy('school_section.grade_id', 'school_section.section_id')
          .select('school_section.grade_id', 'school_section.section_id', this.db.raw('COALESCE(AVG(student_top.top_score), 0) AS ocs'));
      })
      .select(this.db.raw('AVG(ocs) AS ogs'))
      .from('section_average')
      .first();

    return row ? row.ogs : null;
  }

  async getOverallGradeScoreByGradeIds(input: Record<string, any>) {
    const row = await this.db
      .with('raw_business_score', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((query) => {
            if (input.status === 'completed') {
              query.whereRaw(completedBusinessExpression);
            }

            if (input.status === 'in_progress') {
              query.whereRaw(`NOT (${completedBusinessExpression})`);
            }
          })
          .select([
            'business.student_id',
            this.db.raw(`
            (
              (CASE WHEN ${completedInnovationExpression}
                THEN (business_progress_score.problem_statement
                    + business_progress_score.market_research
                    + business_progress_score.market_fit
                    + business_progress_score.prototype) / 4.0
                ELSE 0 END)
              +
              (CASE WHEN ${completedEntrepreneurshipExpression}
                THEN (business_progress_score.business_model
                    + business_progress_score.financial_planning
                    + business_progress_score.marketing) / 3.0
                ELSE 0 END)
              +
              (CASE WHEN ${completedCommunicationExpression}
                THEN business_progress_score.pitch_feedback
                ELSE 0 END)
            ) / 3.0 AS total_score
          `),
          ]);
      })

      .with('student_top', (qb) => {
        qb.from('enrollment')
          .leftJoin('raw_business_score', 'raw_business_score.student_id', 'enrollment.student_id')
          .where({
            'enrollment.school_id': input.schoolId,
            'enrollment.enrollment_status_id': 1,
          })
          .modify((query) => {
            if (input.gradeIds?.length) {
              query.whereIn('enrollment.grade_id', input.gradeIds);
            }
          })
          .groupBy('enrollment.student_id', 'enrollment.grade_id', 'enrollment.section_id')
          .select(['enrollment.grade_id', 'enrollment.section_id', this.db.raw('COALESCE(MAX(raw_business_score.total_score), 0) AS top_score')]);
      })

      .with('section_average', (qb) => {
        qb.from('school_section')
          .leftJoin('student_top', function () {
            this.on('student_top.section_id', '=', 'school_section.section_id').andOn('student_top.grade_id', '=', 'school_section.grade_id');
          })
          .where({
            'school_section.school_id': input.schoolId,
          })
          .modify((query) => {
            if (input.gradeIds?.length) {
              query.whereIn('school_section.grade_id', input.gradeIds);
            }
          })
          .groupBy('school_section.grade_id', 'school_section.section_id')
          .select('school_section.grade_id', this.db.raw('COALESCE(AVG(student_top.top_score), 0) AS section_score'));
      })

      .with('grade_average', (qb) => {
        qb.from('section_average').groupBy('grade_id').select('grade_id', this.db.raw('AVG(section_score) AS grade_score'));
      })

      .from('grade_average')
      .select(this.db.raw('AVG(grade_score) AS ogs'))
      .first();
    return row;
  }

  async getGradePerformanceScores(input: Record<string, any>) {
    const row = await this.db
      .with('raw_scores', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((query) => {
            if (input.status === 'completed') {
              query.whereRaw(completedBusinessExpression);
            }

            if (input.status === 'in_progress') {
              query.whereRaw(`NOT (${completedBusinessExpression})`);
            }
          })
          .select([
            'business.student_id',

            this.db.raw(`
            CASE WHEN business_progress_status.prototype = true
              AND business_progress_score.problem_statement IS NOT NULL
              AND business_progress_score.market_research IS NOT NULL
              AND business_progress_score.market_fit IS NOT NULL
              AND business_progress_score.prototype IS NOT NULL
            THEN (
              business_progress_score.problem_statement +
              business_progress_score.market_research +
              business_progress_score.market_fit +
              business_progress_score.prototype
            ) / 4.0
            ELSE 0 END AS innovation_score
          `),

            this.db.raw(`
            CASE WHEN business_progress_status.marketing = true
              AND business_progress_score.business_model IS NOT NULL
              AND business_progress_score.financial_planning IS NOT NULL
              AND business_progress_score.marketing IS NOT NULL
            THEN (
              business_progress_score.business_model +
              business_progress_score.financial_planning +
              business_progress_score.marketing
            ) / 3.0
            ELSE 0 END AS entrepreneurship_score
          `),

            this.db.raw(`
            CASE WHEN business_progress_status.pitch_feedback = true
              AND business_progress_score.pitch_feedback IS NOT NULL
            THEN business_progress_score.pitch_feedback
            ELSE 0 END AS communication_score
          `),
          ]);
      })

      .with('student_avg', (qb) => {
        qb.from('enrollment')
          .leftJoin('raw_scores', 'raw_scores.student_id', 'enrollment.student_id')
          .where({
            'enrollment.school_id': input.schoolId,
            'enrollment.grade_id': input.gradeId,
            'enrollment.enrollment_status_id': 1,
          })
          .groupBy('enrollment.student_id', 'enrollment.grade_id', 'enrollment.section_id')
          .select([
            'enrollment.grade_id',
            'enrollment.section_id',
            this.db.raw('COALESCE(AVG(innovation_score), 0) AS student_innovation_score'),
            this.db.raw('COALESCE(AVG(entrepreneurship_score), 0) AS student_entrepreneurship_score'),
            this.db.raw('COALESCE(AVG(communication_score), 0) AS student_communication_score'),
          ]);
      })

      .with('section_avg', (qb) => {
        qb.from('school_section')
          .leftJoin('student_avg', function () {
            this.on('student_avg.section_id', '=', 'school_section.section_id').andOn('student_avg.grade_id', '=', 'school_section.grade_id');
          })
          .where({
            'school_section.school_id': input.schoolId,
            'school_section.grade_id': input.gradeId,
          })
          .groupBy('school_section.grade_id', 'school_section.section_id')
          .select([
            'school_section.grade_id',
            'school_section.section_id',
            this.db.raw('COALESCE(AVG(student_innovation_score), 0) AS section_innovation_score'),
            this.db.raw('COALESCE(AVG(student_entrepreneurship_score), 0) AS section_entrepreneurship_score'),
            this.db.raw('COALESCE(AVG(student_communication_score), 0) AS section_communication_score'),
          ]);
      })

      .select([
        this.db.raw('COALESCE(AVG(section_innovation_score), 0) AS gis'),
        this.db.raw('COALESCE(AVG(section_entrepreneurship_score), 0) AS ges'),
        this.db.raw('COALESCE(AVG(section_communication_score), 0) AS gcs'),
      ])
      .from('section_avg')
      .first();
    return row ?? { gis: 0, ges: 0, gcs: 0 };
  }

  async getOverallSchoolScore(input: Record<string, any>) {
    const row = await this.db
      .with('raw_business_score', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((q) => {
            if (input.status === BusinessStatus.COMPLETED) q.whereRaw(`(${completedBusinessExpression})`);
            if (input.status === BusinessStatus.IN_PROGRESS) q.whereRaw(`NOT (${completedBusinessExpression})`);
          })
          .select([
            'business.student_id',
            this.db.raw(`
            (
              (CASE WHEN ${completedInnovationExpression}
                THEN (business_progress_score.problem_statement
                    + business_progress_score.market_research
                    + business_progress_score.market_fit
                    + business_progress_score.prototype) / 4.0
                ELSE 0 END)
              +
              (CASE WHEN ${completedEntrepreneurshipExpression}
                THEN (business_progress_score.business_model
                    + business_progress_score.financial_planning
                    + business_progress_score.marketing) / 3.0
                ELSE 0 END)
              +
              (CASE WHEN ${completedCommunicationExpression}
                THEN business_progress_score.pitch_feedback
                ELSE 0 END)
            ) / 3.0 AS total_score
          `),
          ]);
      })
      .with('student_top', (qb) => {
        qb.from('enrollment')
          .leftJoin('raw_business_score', 'raw_business_score.student_id', 'enrollment.student_id')
          .where({
            'enrollment.school_id': input.schoolId,
            'enrollment.enrollment_status_id': 1,
          })
          .groupBy('enrollment.student_id', 'enrollment.grade_id', 'enrollment.section_id')
          .select(['enrollment.grade_id', 'enrollment.section_id', this.db.raw('COALESCE(MAX(raw_business_score.total_score), 0) AS top_score')]);
      })
      .with('section_average', (qb) => {
        qb.from('school_section')
          .leftJoin('student_top', function () {
            this.on('student_top.section_id', '=', 'school_section.section_id').andOn('student_top.grade_id', '=', 'school_section.grade_id');
          })
          .where({
            'school_section.school_id': input.schoolId,
          })
          .groupBy('school_section.grade_id', 'school_section.section_id')
          .select('school_section.grade_id', 'school_section.section_id', this.db.raw('COALESCE(AVG(student_top.top_score), 0) AS ocs'));
      })
      .with('grade_average', (qb) => {
        qb.from('school_grade')
          .leftJoin('section_average', 'section_average.grade_id', 'school_grade.grade_id')
          .where('school_grade.school_id', input.schoolId)
          .groupBy('school_grade.grade_id')
          .select(this.db.raw('COALESCE(AVG(section_average.ocs), 0) AS ogs'));
      })
      .select(this.db.raw('AVG(ogs) AS oss'))
      .from('grade_average')
      .first();

    return row ? row.oss : null;
  }

  async getBusinessReport(input: Record<string, any>) {
    const query = this.db('business')
      .leftJoin('business_progress_score', 'business_progress_score.business_id', 'business.id')
      .leftJoin('business_progress_status', 'business_progress_status.business_id', 'business.id')
      .select([
        'business.*',
        this.db.raw(`
          CASE
            WHEN ${completedBusinessExpression} THEN 'COMPLETED'
            ELSE 'IN_PROGRESS'
          END AS status
        `),

        {
          i1_score: 'business_progress_score.problem_statement',
          i2_score: 'business_progress_score.market_research',
          i3_score: 'business_progress_score.market_fit',
          i4_score: 'business_progress_score.prototype',

          e1_score: 'business_progress_score.business_model',
          e2_score: 'business_progress_score.financial_planning',
          e3_score: 'business_progress_score.marketing',

          c1_score: 'business_progress_score.pitch_feedback',

          i1_status: 'business_progress_status.problem_statement',
          i2_status: 'business_progress_status.market_research',
          i3_status: 'business_progress_status.market_fit',
          i4_status: 'business_progress_status.prototype',

          e1_status: 'business_progress_status.business_model',
          e2_status: 'business_progress_status.financial_planning',
          e3_status: 'business_progress_status.marketing',

          c1_status: 'business_progress_status.pitch_feedback',
        },

        this.db.raw(`
          CASE
            WHEN ${completedInnovationExpression}
            THEN
              (
                business_progress_score.problem_statement +
                business_progress_score.market_research +
                business_progress_score.market_fit +
                business_progress_score.prototype
              ) / 4.0
            ELSE 0
          END AS i_average
        `),

        this.db.raw(`
          CASE
            WHEN ${completedEntrepreneurshipExpression} 
            THEN
              (
                business_progress_score.business_model +
                business_progress_score.financial_planning +
                business_progress_score.marketing
              ) / 3.0
            ELSE 0
          END AS e_average
        `),

        this.db.raw(`
          CASE
            WHEN ${completedCommunicationExpression}
            THEN
              business_progress_score.pitch_feedback
            ELSE 0
          END AS c_average
        `),

        this.db.raw(`
          (
            (
              CASE
                WHEN ${completedInnovationExpression}
                THEN
                  (
                    business_progress_score.problem_statement +
                    business_progress_score.market_research +
                    business_progress_score.market_fit +
                    business_progress_score.prototype
                  ) / 4.0
                ELSE 0
              END
            )
            +
            (
              CASE
                WHEN ${completedEntrepreneurshipExpression}
                THEN
                  (
                    business_progress_score.business_model +
                    business_progress_score.financial_planning +
                    business_progress_score.marketing
                  ) / 3.0
                ELSE 0
              END
            )
            +
            (
              CASE
                WHEN ${completedCommunicationExpression}
                THEN business_progress_score.pitch_feedback
                ELSE 0
              END
            )
          ) / 3.0 AS overall_average
        `),
      ]);

    query.modify((qb) => {
      qb.whereNull('business.deleted_at');

      if (isDefined(input.businessId)) {
        qb.where('business.id', input.businessId);
      }

      if (isDefined(input.schoolId)) {
        qb.where('business.school_id', input.schoolId);
      }

      if (isDefined(input.studentId)) {
        qb.where('business.student_id', input.studentId);
      }
    });

    const [row] = await query;

    return row ? BusinessMapper.toBusiness(row) : null;
  }

  async getOverallSchoolPhaseScores(input: Record<string, any>) {
    const row = await this.db
      .with('business_phase_scores', (qb) => {
        qb.from('business')
          .join('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .join('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .where('enrollment_status.code', EnrollmentStatusEnum.ACTIVE)
          .whereNull('business.deleted_at')
          .modify((q) => {
            if (input.status === BusinessStatus.COMPLETED) q.whereRaw(`(${completedBusinessExpression})`);
            if (input.status === BusinessStatus.IN_PROGRESS) q.whereRaw(`NOT (${completedBusinessExpression})`);
          })
          .select([
            'business.student_id',
            this.db.raw(`
              CASE
                WHEN ${completedInnovationExpression}
                THEN
                  (
                    business_progress_score.problem_statement +
                    business_progress_score.market_research +
                    business_progress_score.market_fit +
                    business_progress_score.prototype
                  ) / 4.0
                ELSE 0
              END AS business_innovation_score
            `),

            this.db.raw(`
              CASE
                WHEN ${completedEntrepreneurshipExpression}
                THEN
                  (
                    business_progress_score.business_model +
                    business_progress_score.financial_planning +
                    business_progress_score.marketing
                  ) / 3.0
                ELSE 0
              END AS business_entrepreneurship_score
            `),

            this.db.raw(`
              CASE
                WHEN ${completedCommunicationExpression}
                THEN
                  business_progress_score.pitch_feedback
                ELSE 0
              END AS business_communication_score
            `),
          ]);
      })
      .with('student_phase_scores', (qb) => {
        qb.from('enrollment')
          .leftJoin('business_phase_scores', 'business_phase_scores.student_id', 'enrollment.student_id')
          .where({
            'enrollment.school_id': input.schoolId,
            'enrollment.enrollment_status_id': 1,
          })
          .groupBy('enrollment.student_id', 'enrollment.grade_id', 'enrollment.section_id')
          .select([
            'enrollment.grade_id',
            'enrollment.section_id',
            this.db.raw('COALESCE(AVG(business_phase_scores.business_innovation_score), 0) AS innovation_score'),
            this.db.raw('COALESCE(AVG(business_phase_scores.business_entrepreneurship_score), 0) AS entrepreneurship_score'),
            this.db.raw('COALESCE(AVG(business_phase_scores.business_communication_score), 0) AS communication_score'),
          ]);
      })
      .with('section_phase_scores', (qb) => {
        qb.from('school_section')
          .leftJoin('student_phase_scores', function () {
            this.on('student_phase_scores.section_id', '=', 'school_section.section_id').andOn('student_phase_scores.grade_id', '=', 'school_section.grade_id');
          })
          .where({
            'school_section.school_id': input.schoolId,
          })
          .groupBy('school_section.grade_id', 'school_section.section_id')
          .select([
            'school_section.grade_id',
            'school_section.section_id',
            this.db.raw('COALESCE(AVG(student_phase_scores.innovation_score), 0) AS cis'),
            this.db.raw('COALESCE(AVG(student_phase_scores.entrepreneurship_score), 0) AS ces'),
            this.db.raw('COALESCE(AVG(student_phase_scores.communication_score), 0) AS ccs'),
          ]);
      })
      .with('grade_phase_scores', (qb) => {
        qb.from('school_grade')
          .leftJoin('section_phase_scores', 'section_phase_scores.grade_id', 'school_grade.grade_id')
          .where('school_grade.school_id', input.schoolId)
          .groupBy('school_grade.grade_id')
          .select([
            this.db.raw('COALESCE(AVG(section_phase_scores.cis), 0) AS gis'),
            this.db.raw('COALESCE(AVG(section_phase_scores.ces), 0) AS ges'),
            this.db.raw('COALESCE(AVG(section_phase_scores.ccs), 0) AS gcs'),
          ]);
      })
      .select([this.db.raw('AVG(gis) AS osis'), this.db.raw('AVG(ges) AS oses'), this.db.raw('AVG(gcs) AS oscs')])
      .from('grade_phase_scores')
      .first();

    return {
      innovation: row ? Number(row.osis) : 0,
      entrepreneurship: row ? Number(row.oses) : 0,
      communication: row ? Number(row.oscs) : 0,
    };
  }

  async getTopPerformedBusinesses(input: Record<string, any>) {
    const db = this.db;

    const query = this.db
      .with('business_scores', (qb) => {
        qb.from('business')
          .leftJoin('enrollment', function () {
            this.on('enrollment.student_id', '=', 'business.student_id').andOn('enrollment.academic_year_id', '=', 'business.ay_id');
          })
          .leftJoin('enrollment_status', 'enrollment_status.id', 'enrollment.enrollment_status_id')
          .leftJoin('grade', 'grade.id', 'enrollment.grade_id')
          .leftJoin('section', 'section.id', 'enrollment.section_id')
          .leftJoin('student', 'student.id', 'enrollment.student_id')
          .leftJoin('business_progress_score', 'business.id', 'business_progress_score.business_id')
          .leftJoin('business_progress_status', 'business.id', 'business_progress_status.business_id')
          .whereNull('business.deleted_at')
          .modify((q) => {
            if (input.academicYearId) q.where('business.ay_id', input.academicYearId);
            if (input.schoolId) q.where('business.school_id', input.schoolId);
            if (input.gradeId) q.where('enrollment.grade_id', input.gradeId);
            if (input.sectionId) q.where('enrollment.section_id', input.sectionId);
            if (input.studentId) q.where('business.student_id', input.studentId);
            if (input.status === BusinessStatus.COMPLETED) q.whereRaw(`(${completedBusinessExpression})`);
            if (input.status === BusinessStatus.IN_PROGRESS) q.whereRaw(`NOT (${completedBusinessExpression})`);
            if (input.enrollmentStatus) q.where('enrollment_status.code', input.enrollmentStatus);
          })
          .select([
            'business.*',
            'enrollment.student_id as enrollment_student_id',
            'student.name as student_name',
            'grade.id as grade_id',
            'grade.name as grade_name',
            'section.id as section_id',
            'section.name as section_name',
            this.db.raw(`
              CASE
                WHEN ${completedInnovationExpression}
                THEN
                  (
                    COALESCE(business_progress_score.problem_statement, 0) +
                    COALESCE(business_progress_score.market_research, 0) +
                    COALESCE(business_progress_score.market_fit, 0) +
                    COALESCE(business_progress_score.prototype, 0)
                  ) / 4.0
                ELSE 0
              END AS avg_i
            `),
            this.db.raw(`
              CASE
                WHEN ${completedEntrepreneurshipExpression}
                THEN
                  (
                    COALESCE(business_progress_score.business_model, 0) +
                    COALESCE(business_progress_score.financial_planning, 0) +
                    COALESCE(business_progress_score.marketing, 0)
                  ) / 3.0
                ELSE 0
              END AS avg_e
            `),
            this.db.raw(`
              CASE
                WHEN ${completedCommunicationExpression}
                THEN COALESCE(business_progress_score.pitch_feedback, 0)
                ELSE 0
              END AS avg_c
            `),
            this.db.raw(`
              (
                (
                  CASE
                    WHEN ${completedInnovationExpression}
                    THEN
                      (
                        COALESCE(business_progress_score.problem_statement, 0) +
                        COALESCE(business_progress_score.market_research, 0) +
                        COALESCE(business_progress_score.market_fit, 0) +
                        COALESCE(business_progress_score.prototype, 0)
                      ) / 4.0
                    ELSE 0
                  END
                )
                +
                (
                  CASE
                    WHEN ${completedEntrepreneurshipExpression}
                    THEN
                      (
                        COALESCE(business_progress_score.business_model, 0) +
                        COALESCE(business_progress_score.financial_planning, 0) +
                        COALESCE(business_progress_score.marketing, 0)
                      ) / 3.0
                    ELSE 0
                  END
                )
                +
                (
                  CASE
                    WHEN ${completedCommunicationExpression}
                    THEN COALESCE(business_progress_score.pitch_feedback, 0)
                    ELSE 0
                  END
                )
              ) / 3.0 AS avg_score
            `),
            this.db.raw(`
              CASE
                WHEN (${completedBusinessExpression}) THEN 0
                ELSE 1
              END AS in_progress_priority
            `),
          ]);
      })
      .with('ranked', (qb) => {
        qb.from('business_scores').select([
          '*',
          this.db.raw(`
            ROW_NUMBER() OVER (
              PARTITION BY business_scores.enrollment_student_id
              ORDER BY
                avg_score DESC,
                in_progress_priority DESC,
                created_at DESC
            ) AS rn
          `),
          this.db.raw('MAX(avg_score) OVER () AS max_score'),
        ]);
      })
      .from('ranked')
      .modify((qb) => {
        if (input.mode === 'BEST_PER_STUDENT' || input.mode === 'TOP_ONLY') {
          qb.where('rn', 1);
        }

        if (input.mode === 'TOP_ONLY') {
          qb.whereRaw('avg_score = max_score');
        }
      })
      .orderBy([
        { column: 'avg_score', order: 'desc' },
        { column: 'in_progress_priority', order: 'desc' },
        { column: 'created_at', order: 'desc' },
      ]);

    applyOffsetPagination(query, input.page, input.limit);

    const rows = await query;

    return BusinessMapper.toBusinesses(rows);
  }
}
