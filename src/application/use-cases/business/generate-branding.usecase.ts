import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { BadRequestException, NotFoundException } from '@shared/execeptions';
import { ICurrentStudentUser } from 'src/core/types';

interface GenerateBrandingUseCaseInput {
  data: {
    businessId: string;
    brandVoice: string;
  };
  user: ICurrentStudentUser;
}

export class GenerateBrandingUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
      amqpConnection: AmqpConnection;
    },
  ) {}

  async execute(input: GenerateBrandingUseCaseInput) {
    const { amqpConnection, businessRepo } = this.dependencies;
    const { data, user } = input;
    const { businessId, brandVoice } = data;

    const business = await businessRepo.getBusiness({ businessId });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const response = await amqpConnection.request<{
      success: boolean;
      fonts: string;
    }>({
      exchange: MSConfig.queues.branding.exchange,
      routingKey: MSConfig.queues.branding.routingKey,
      timeout: MSConfig.queues.branding.timeout,
      payload: {
        student: {
          grade: user.gradeName,
        },
        business: {
          brandVoice: brandVoice,
        },
      },
    });

    if (!response.success) {
      throw new BadRequestException('Branding analysis could not be completed successfully.');
    }

    return response.fonts;
  }
}
