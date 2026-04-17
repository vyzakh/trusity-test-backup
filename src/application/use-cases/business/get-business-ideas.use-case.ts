import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LookupRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { BadRequestException } from '@shared/execeptions';

interface GetBusinessIdeasUseCaseInput {
  data: { sdgIds: number[]; keywords: string };
  user: ICurrentStudentUser;
}

export class GetBusinessIdeasUseCase {
  constructor(private readonly dependencies: { amqpConnection: AmqpConnection; lookupRepo: LookupRepository }) {}

  async execute(input: GetBusinessIdeasUseCaseInput) {
    const { amqpConnection, lookupRepo } = this.dependencies;
    const { data, user } = input;

    const sdgs = await lookupRepo.getSdgTitlesByIds({ sdgIds: data.sdgIds });

    const response = await amqpConnection.request<{
      success: boolean;
      message: string;
      ideas: { id: number; idea: string }[];
    }>({
      exchange: MSConfig.queues.idea.exchange,
      routingKey: MSConfig.queues.idea.routingKey,
      timeout: MSConfig.queues.idea.timeout,
      payload: { keywords: data.keywords, sdgs, student: { grade: user.gradeName } },
    });

    if (!response.success) {
      throw new BadRequestException(response.message);
    }

    return response.ideas.map((idea) => ({ id: idea.id, idea: idea.idea.trim() }));
  }
}
