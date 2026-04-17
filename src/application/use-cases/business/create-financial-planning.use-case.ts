import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { BadRequestException, InformationException, NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';

interface MonthlyData {
  y1: number;
  y2: number;
  y3: number;
  y4: number;
  y5: number;
}

interface FinancialData {
  M1: MonthlyData;
  M2: MonthlyData;
  M3: MonthlyData;
  M4: MonthlyData;
  M5: MonthlyData;
  M6: MonthlyData;
  M7: MonthlyData;
  M8: MonthlyData;
  M9: MonthlyData;
  M10: MonthlyData;
  M11: MonthlyData;
  M12: MonthlyData;
}

interface CreateFinancialPlanningUseCaseInput {
  data: {
    businessId: string;
    sales: FinancialData;
    breakeven: FinancialData;
    breakevenPoint: string;
    financialPlanDescription: string;
    risksAndMitigations: string;
    futurePlans: string;
  };
  user: ICurrentStudentUser;
}

export class CreateFinancialPlanningUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
      amqpConnection: AmqpConnection;
    },
  ) {}

  async execute(input: CreateFinancialPlanningUseCaseInput) {
    const { amqpConnection, businessRepo } = this.dependencies;
    const { data, user } = input;
    const { businessId, sales, breakeven, breakevenPoint, ...financialPlanningData } = data;
    const business = await businessRepo.getBusiness({ businessId: data.businessId });

    if (!business) {
      throw new NotFoundException('Business not found');
    }
    const businessQuery = {
      businessId: data.businessId,
      schoolId: user.schoolId,
      studentId: user.id,
    };

    const businessProgressScore = await businessRepo.getBusinessProgressScore(businessQuery);
    if (!businessProgressScore) {
      throw new NotFoundException('The progress details for this business could not be found.');
    }

    const response = await amqpConnection.request<{
      success: boolean;
      score: number;
      message: string;
    }>({
      exchange: MSConfig.queues.financialPlanning.exchange,
      routingKey: MSConfig.queues.financialPlanning.routingKey,
      timeout: MSConfig.queues.financialPlanning.timeout,
      payload: {
        student: {
          grade: user.gradeName,
        },
        business: {
          idea: business.idea,
          problemStatement: business.problemStatement,
          targetMarket: business.targetMarket,
          marketResearch: business.marketResearch,
          marketFit: business.marketFit,
          prototypeDescription: business.prototypeDescription,
          businessModel: business.businessModel,
          sdgs: business.sdgsText,
          financialPlanning: financialPlanningData,
        },
      },
    });

    if (!response.success) {
      throw new BadRequestException(response.message);
    }
    if (!businessProgressScore.financialProjections && response.score === 0) {
      throw new InformationException('A score of zero cannot be saved. Please try again to achieve a higher score.');
    }
    if (response.score < (businessProgressScore.financialProjections ?? 0)) {
      throw new InformationException(
        `Your new score (${response.score}) is less than your earlier score (${businessProgressScore.financialProjections ?? 0}), so it won’t be updated. Keep your best score, and feel free to try again!`,
      );
    }
    const actionAt = genTimestamp().iso;

    const finalPayload = {
      businessId: data.businessId,
      sales: JSON.stringify([data.sales]),
      breakeven: JSON.stringify([data.breakeven]),
      breakevenPoint: data.breakevenPoint,
      financialProjectionsDescription: data.financialPlanDescription,
      risksAndMitigations: data.risksAndMitigations,
      futurePlans: data.futurePlans,
      updatedAt: actionAt,
    };

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness(finalPayload),
      businessRepo.updateBusinessProgressScore({
        businessId: data.businessId,
        financialProjectionsScore: response.score,
        updatedAt: actionAt,
      }),
      businessRepo.updateBusinessProgressStatus({
        businessId: data.businessId,
        financialProjectionsStatus: true,
        updatedAt: actionAt,
      }),
    ]);

    if (!updatedBusiness) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    return updatedBusiness;
  }
}
