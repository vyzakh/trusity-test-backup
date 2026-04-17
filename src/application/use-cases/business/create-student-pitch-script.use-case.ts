import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { NotFoundException } from '@shared/execeptions';
import { noop, sanitizeInput } from '@shared/utils';

interface Input {
  businessId: string;
  narrative: string;
  pitchDescription: string;
}

export class CreateStudentPitchScriptUseCase {
  constructor(
    private readonly dependencies: {
      amqpConnection: AmqpConnection;
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: Input, user: ICurrentStudentUser) {
    const { amqpConnection, businessRepo } = this.dependencies;

    const pitchScriptPayload: Record<string, any> = {
      businessId: parseInt(input.businessId),
      narrative: sanitizeInput(input.narrative),
      pitchDescription: sanitizeInput(input.pitchDescription),
    };

    const businessResponse = await businessRepo.getBusiness(input);
    if (!businessResponse) {
      throw new NotFoundException(`Business with ID ${input.businessId} not found`);
    }

    const callToAction =
      businessResponse.callToAction ??
      'Join us in revolutionizing the industry with our innovative solution. Invest in our vision and be part of a transformative journey that promises growth, impact, and success. Together, we can make a difference and achieve extraordinary milestones.';

    const pitchScriptQueue = {
      student: {
        grade: user.gradeName,
      },
      business: {
        idea: businessResponse.idea,
        problemStatement: businessResponse.problemStatement,
        targetMarket: businessResponse.targetMarket,
        marketResearch: businessResponse.marketResearch,
        marketFit: businessResponse.marketFit,
        prototypeDescription: businessResponse.prototypeDescription,
        businessModel: businessResponse.businessModel ?? {
          keyPartners: businessResponse.businessModel?.keyPartners ?? null,
          customerSegments: businessResponse.businessModel?.customerSegments ?? null,
          valuePropositions: businessResponse.businessModel?.valuePropositions ?? null,
          channels: businessResponse.businessModel?.channels ?? null,
          customerRelationships: businessResponse.businessModel?.customerRelationships ?? null,
          revenueStreams: businessResponse.businessModel?.revenueStreams ?? null,
          keyResources: businessResponse.businessModel?.keyResources ?? null,
          keyActivities: businessResponse.businessModel?.keyActivities ?? null,
          costStructure: businessResponse.businessModel?.costStructure ?? null,
          targetMarketSize: businessResponse.businessModel?.targetMarketSize ?? null,
          goalsAndKPIs: businessResponse.businessModel?.goalsAndKPIs ?? null,
        },
        financialPlanning: {
          financialPlanDescription: businessResponse.financialProjectionsDescription ?? '',
          risksAndMitigations: businessResponse.risksAndMitigations ?? '',
          futurePlans: businessResponse.futurePlans ?? '',
        },
        brandingAndMarketing: {
          brandVoice: businessResponse.branding.brandVoice ?? '',
          customerExperience: businessResponse.customerExperience,
          marketing: businessResponse.marketing,
          competitorAnalysis: businessResponse.competitorAnalysis,
        },
        pitch: {
          callToAction: callToAction,
          narrative: pitchScriptPayload.narrative,
          pitch: pitchScriptPayload.pitchDescription,
        },
      },
    };

    const response = await sendStudentPitchScript({ amqpConnection }, { pitchScriptQueue }).catch(noop);

    if (response.success !== true) {
      throw new NotFoundException('Failed to generate pitch script. Please try again later.');
    }

    const aiGeneratedScript = JSON.stringify(response.pitch);

    return { id: input.businessId, aiGeneratedScript: aiGeneratedScript };
  }
}

async function sendStudentPitchScript(deps: { amqpConnection: AmqpConnection }, context: Record<string, any>) {
  const { pitchScriptQueue } = context;
  const { amqpConnection } = deps;

  const response = await amqpConnection.request<any>({
    exchange: MSConfig.queues.studentPitchScript.exchange,
    routingKey: MSConfig.queues.studentPitchScript.routingKey,
    timeout: MSConfig.queues.studentPitchScript.timeout,
    payload: pitchScriptQueue,
  });
  return response;
}
