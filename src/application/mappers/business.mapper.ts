export class BusinessMapper {
  static toBusiness(row: any) {
    return {
      id: row.id,
      academicYearId: row.ay_id,
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
      competitorAnalysis: row.competitor_analysis,
      marketing: row.marketing,
      marketingFeedback: row.marketing_feedback,
      source: row.source,
      sdgsText: row.sdgs_text,
      studentId: row.student_id,
      challengeId: row.challenge_id,
      status: row.status,
      innovation: {
        scores: {
          i1: row.i1_score !== null ? Number(row.i1_score) : null,
          i2: row.i2_score !== null ? Number(row.i2_score) : null,
          i3: row.i3_score !== null ? Number(row.i3_score) : null,
          i4: row.i4_score !== null ? Number(row.i4_score) : null,
        },
        statuses: {
          i1: row.i1_status !== null ? Boolean(row.i1_status) : null,
          i2: row.i2_status !== null ? Boolean(row.i2_status) : null,
          i3: row.i3_status !== null ? Boolean(row.i3_status) : null,
          i4: row.i4_status !== null ? Boolean(row.i4_status) : null,
        },

        averageIScore: row.i_average !== null ? Number(row.i_average) : null,
      },
      entrepreneurship: {
        scores: {
          e1: row.e1_score !== null ? Number(row.e1_score) : null,
          e2: row.e2_score !== null ? Number(row.e2_score) : null,
          e3: row.e3_score !== null ? Number(row.e3_score) : null,
        },
        statuses: {
          e1: row.e1_status !== null ? Boolean(row.e1_status) : null,
          e2: row.e2_status !== null ? Boolean(row.e2_status) : null,
          e3: row.e3_status !== null ? Boolean(row.e3_status) : null,
        },

        averageEScore: row.e_average !== null ? Number(row.e_average) : null,
      },
      communication: {
        scores: {
          c1: row.c1_score !== null ? Number(row.c1_score) : null,
        },
        statuses: {
          c1: row.c1_status !== null ? Boolean(row.c1_status) : null,
        },
        averageCScore: row.c_average !== null ? Number(row.c_average) : null,
      },
      launchRecommendation: row.launch_recommendation,
      investment: row.investment,
      overallAverageScore: row.overall_average !== null ? Number(row.overall_average) : null,
      student: {
        id: row.student_id,
        name: row.student_name,
        gradeId: row.grade_id,
        sectionId: row.section_id,
        schoolId: row.school_id,
        gradeName: row.grade_name,
        sectionName: row.section_name,
      },
      averageScores: {
        avgIScore: row.avg_i,
        avgEScore: row.avg_e,
        avgCScore: row.avg_c,
        averageScore: row.avg_score,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  static toBusinesses(rows: any[]) {
    return rows.map(this.toBusiness);
  }
  static totalUniqueBusinessCount(rows: any[]) {
    return rows.reduce((sum, row) => {
      return sum + Number(row.unique_business_count || 0);
    }, 0);
  }
  static toBusinessesAverageScores(row: any) {
    return {
      avgIScore: Number(row.avg_i_score),
      avgEScore: Number(row.avg_e_score),
      avgCScore: Number(row.avg_c_score),
    };
  }
}
