import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('business_learning_step').del();
  await knex('business_learning_phase').del();

  await knex('business_learning_phase').insert([
    { id: 1, name: 'Innovation', code: 'innovation', sort_order: 1 },
    { id: 2, name: 'Entrepreneurship', code: 'entrepreneurship', sort_order: 2 },
    { id: 3, name: 'Communication', code: 'communication', sort_order: 3 },
    { id: 4, name: 'Launch', code: 'launch', sort_order: 4 },
  ]);

  await knex('business_learning_step').insert([
    // Phase 1 - Innovation
    { id: 1, business_learning_phase_id: 1, name: 'Ideate', code: 'ideate', sort_order: 1 },
    { id: 2, business_learning_phase_id: 1, name: 'Problem Statement', code: 'problem-statement', sort_order: 2 },
    { id: 3, business_learning_phase_id: 1, name: 'Market Research', code: 'market-research', sort_order: 3 },
    { id: 4, business_learning_phase_id: 1, name: 'Market Fit', code: 'market-fit', sort_order: 4 },
    { id: 5, business_learning_phase_id: 1, name: 'Prototype', code: 'prototype', sort_order: 5 },

    // Phase 2 - Entrepreneurship
    { id: 6, business_learning_phase_id: 2, name: 'Business Model', code: 'business-model', sort_order: 1 },
    { id: 7, business_learning_phase_id: 2, name: 'Revenue Model', code: 'revenue-model', sort_order: 2 },
    { id: 8, business_learning_phase_id: 2, name: 'Financial Planning - CAPEX', code: 'capex', sort_order: 3 },
    { id: 9, business_learning_phase_id: 2, name: 'Financial Planning - OPEX', code: 'opex', sort_order: 4 },
    { id: 10, business_learning_phase_id: 2, name: 'Financial Planning - Final Projections', code: 'final-projections', sort_order: 5 },
    { id: 11, business_learning_phase_id: 2, name: 'Branding', code: 'branding', sort_order: 6 },
    { id: 12, business_learning_phase_id: 2, name: 'Marketing', code: 'marketing', sort_order: 7 },

    // Phase 3 - Communication
    { id: 13, business_learning_phase_id: 3, name: 'Pitch Deck', code: 'pitch-deck', sort_order: 1 },
    { id: 14, business_learning_phase_id: 3, name: 'Pitch Script', code: 'pitch-script', sort_order: 2 },
    { id: 15, business_learning_phase_id: 3, name: 'Pitch Feedback', code: 'pitch-feedback', sort_order: 3 },

    // Phase 4 - Launch
    { id: 16, business_learning_phase_id: 4, name: 'Launch', code: 'launch', sort_order: 1 },
    { id: 17, business_learning_phase_id: 4, name: 'Business Summary', code: 'business-summary', sort_order: 2 },
  ]);
}
