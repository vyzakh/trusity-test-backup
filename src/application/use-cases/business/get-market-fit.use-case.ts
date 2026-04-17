import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MSConfig } from '@infrastructure/microservice';

interface Data {
  marketFit: string;
}

interface marketFitFeedbackInput {
  marketFit: Data;
  user: ICurrentStudentUser;
}

export class GetMarketFitFeedbackUseCase {
  constructor(
    private readonly dependencies: {
      amqpConnection: AmqpConnection;
    },
  ) {}

  async execute(input: marketFitFeedbackInput) {
    const { amqpConnection } = this.dependencies;
    const { marketFit, user } = input;

    const response = await amqpConnection.request<any>({
      exchange: MSConfig.queues.problemStatement.exchange,
      routingKey: MSConfig.queues.problemStatement.routingKey,
      payload: {
        student: { grade: user.gradeName },
        marketFit,
      },
      timeout: MSConfig.queues.problemStatement.timeout,
    });
    console.log('jjjjjjjj', response);
    // return {
    //   marketFit: response.marketFit,
    //   score: response.score,
    // };
  }
}
