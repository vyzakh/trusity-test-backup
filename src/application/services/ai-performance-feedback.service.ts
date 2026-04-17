import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MSConfig } from '@infrastructure/microservice';
import { Logger } from '@nestjs/common';

export class AiPerformanceFeedbackService {
  private logger: Logger;
  constructor(private readonly deps: { amqpConnection: AmqpConnection }) {
    this.logger = new Logger(AiPerformanceFeedbackService.name);
  }

  async getSchoolFeedback({ scores }: { scores: Record<string, number> }): Promise<{ success: boolean; feedback: string }> {
    const { amqpConnection } = this.deps;

    try {
      const response = await amqpConnection.request<{
        success: boolean;
        feedback: string;
      }>({
        exchange: MSConfig.queues.schoolAIFeedback.exchange,
        routingKey: MSConfig.queues.schoolAIFeedback.routingKey,
        payload: {
          scores,
        },
        timeout: MSConfig.queues.schoolAIFeedback.timeout,
      });

      if (!response.success) {
        this.logger.warn('Failed to get school AI feedback', response);
        return {
          success: false,
          feedback: 'Failed to retrieve school AI feedback.',
        };
      }

      return response;
    } catch (error) {
      this.logger.error('Error getting school AI feedback', error);

      return {
        success: false,
        feedback: 'Failed to retrieve school AI feedback due to an internal error.',
      };
    }
  }

  async getGradeFeedback({ grades, scores }: { grades: string[]; scores: Record<string, number> }): Promise<{ success: boolean; feedback: string }> {
    try {
      const response = await this.deps.amqpConnection.request<{
        success: boolean;
        feedback: string;
      }>({
        exchange: MSConfig.queues.gradeAIFeedback.exchange,
        routingKey: MSConfig.queues.gradeAIFeedback.routingKey,
        payload: {
          grades,
          scores,
        },
        timeout: MSConfig.queues.gradeAIFeedback.timeout,
      });

      if (!response.success) {
        this.logger.warn('Failed to get grade AI feedback', response);

        return {
          success: false,
          feedback: 'Failed to retrieve grade AI feedback.',
        };
      }

      return response;
    } catch (error) {
      this.logger.error('Error getting grade AI feedback', error);

      return {
        success: false,
        feedback: 'Failed to retrieve grade AI feedback due to an internal error.',
      };
    }
  }

  async getSectionFeedback({ scores }: { scores: Record<string, number> }): Promise<{ success: boolean; feedback: string }> {
    try {
      const response = await this.deps.amqpConnection.request<{
        success: boolean;
        feedback: string;
      }>({
        exchange: MSConfig.queues.classAIFeedback.exchange,
        routingKey: MSConfig.queues.classAIFeedback.routingKey,
        payload: {
          scores,
        },
        timeout: MSConfig.queues.classAIFeedback.timeout,
      });

      if (!response.success) {
        this.logger.warn('Failed to get section AI feedback', response);
        return {
          success: false,
          feedback: 'Failed to retrieve section AI feedback.',
        };
      }

      return response;
    } catch (error) {
      this.logger.error('Error getting section AI feedback', error);

      return {
        success: false,
        feedback: 'Failed to retrieve section AI feedback due to an internal error.',
      };
    }
  }

  async getBusinessFeedback({
    businessId,
  }: {
    businessId: string;
  }): Promise<{ success: boolean; innovationFeedback: string; entrepreneurshipFeedback: string; communicationFeedback: string }> {
    try {
      const response = await this.deps.amqpConnection.request<{
        success: boolean;
        innovationFeedback: string;
        entrepreneurshipFeedback: string;
        communicationFeedback: string;
      }>({
        exchange: MSConfig.queues.performanceFeedback.exchange,
        routingKey: MSConfig.queues.performanceFeedback.routingKey,
        payload: {
          businessId,
        },
        timeout: MSConfig.queues.performanceFeedback.timeout,
      });

      if (!response.success) {
        this.logger.warn('Failed to get business AI feedback', response);

        return {
          success: false,
          communicationFeedback: 'Failed to retrieve business AI feedback.',
          entrepreneurshipFeedback: 'Failed to retrieve business AI feedback.',
          innovationFeedback: 'Failed to retrieve business AI feedback.',
        };
      }

      return response;
    } catch (error) {
      this.logger.error('Error getting business AI feedback', error);

      return {
        success: false,
        communicationFeedback: 'Failed to retrieve business AI feedback due to an internal error.',
        entrepreneurshipFeedback: 'Failed to retrieve business AI feedback due to an internal error.',
        innovationFeedback: 'Failed to retrieve business AI feedback due to an internal error.',
      };
    }
  }
}
