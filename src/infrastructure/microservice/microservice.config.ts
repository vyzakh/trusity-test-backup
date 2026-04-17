export const MSConfig = {
  exchanges: {
    business: { name: 'business-exchange-1', type: 'direct', createExchangeIfNotExists: true },
  },
  queues: {
    idea: { name: 'idea.queue', routingKey: 'idea', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    problemStatement: { name: 'ps-queue', routingKey: 'ps', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    marketResearch: { name: 'mr.queue', routingKey: 'mr', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    marketFit: { name: 'mf.queue', routingKey: 'mf', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    prototype: { name: 'pt.queue', routingKey: 'pt', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    businessModel: { name: 'bm.queue', routingKey: 'bm', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    studentPitchScript: { name: 'pitch.queue', routingKey: 'pitch', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    financialPlanning: { name: 'fp.queue', routingKey: 'fp', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    branding: { name: 'br.queue', routingKey: 'br', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    marketPlan: { name: 'mt.queue', routingKey: 'mt', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    launch: { name: 'lr.queue', routingKey: 'lr', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    studentPitchFeedback: { name: 'pf.queue', routingKey: 'pf', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    performanceFeedback: { name: 'feedback.queue', routingKey: 'student-performance-feedback', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    classAIFeedback: { name: 'classFeedback.queue', routingKey: 'class-level-performance-feedback', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    schoolAIFeedback: { name: 'schoolFeedback.queue', routingKey: 'school-level-performance-feedback', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
    gradeAIFeedback: { name: 'gradeFeedback.queue', routingKey: 'grade-level-performance-feedback', exchange: 'business-exchange-1', createQueueIfNotExists: true, timeout: 3600000 },
  },
};
