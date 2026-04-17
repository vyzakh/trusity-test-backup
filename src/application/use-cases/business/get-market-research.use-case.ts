import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MSConfig } from '@infrastructure/microservice';

interface Data {
  targetMarket: string;
  marketResearch: string;
}

interface ProblemStatementInput {
  marketResearch: Data;
  user: ICurrentStudentUser;
}

export class GetMarketResearchUseCase {
  constructor(
    private readonly dependencies: {
      amqpConnection: AmqpConnection;
    },
  ) {}

  async execute(input: ProblemStatementInput) {
    const { amqpConnection } = this.dependencies;
    const { marketResearch, user } = input;

    const response = await amqpConnection.request<any>({
      exchange: MSConfig.queues.marketResearch.exchange,
      routingKey: MSConfig.queues.marketResearch.routingKey,
      payload: {
        student: { grade: user.gradeName, businessId: user.id },
        targetMarket: marketResearch.targetMarket,
        marketResearch: marketResearch.marketResearch,
      },
      timeout: MSConfig.queues.marketResearch.timeout,
    });
    console.log('jjjjjjjj', response);
    //   return {
    //     id: problemStatementResult.id,
    //     statement: problemStatementResult?.problemStatement,
    //     score: problemStatementResult.score,
    //   };
  }
}
