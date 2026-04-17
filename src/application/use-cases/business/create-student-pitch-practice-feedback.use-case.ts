import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { InformationException, NotFoundException } from '@shared/execeptions';

interface Input {
  businessId: string;
  videoUrl: string;
  user: ICurrentStudentUser;
}

export class CreateStudentPitchPracticeAndFeedbackUseCase {
  constructor(
    private readonly dependencies: {
      amqpConnection: AmqpConnection;
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: Input) {
    const { amqpConnection, businessRepo } = this.dependencies;

    const businessResponse = await businessRepo.getBusiness({ businessId: input.businessId });
    if (!businessResponse) {
      throw new NotFoundException(`Business with ID ${input.businessId} not found`);
    }

    const sanitizedVideoUrl = input.videoUrl.replace(/\s+/g, '%20');
    const businessQuery = {
      businessId: input.businessId,
      schoolId: input.user.schoolId,
      studentId: input.user.id,
    };

    const businessProgressScore = await businessRepo.getBusinessProgressScore(businessQuery);

    if (!businessProgressScore) {
      throw new NotFoundException('The progress details for this business could not be found.');
    }

    const response = await amqpConnection.request<any>({
      exchange: MSConfig.queues.studentPitchFeedback.exchange,
      routingKey: MSConfig.queues.studentPitchFeedback.routingKey,
      timeout: MSConfig.queues.studentPitchFeedback.timeout,
      payload: {
        videoUrl: sanitizedVideoUrl,
        pitchScript: businessResponse.pitchAiGeneratedScript,
      },
    });

    const aiFeedback = response?.analysis?.ai_feedback;

    if (aiFeedback?.status !== 'success') {
      const feedback = aiFeedback?.feedback;

      let message: string = 'AI feedback generation failed. Please try again.';

      if (Array.isArray(feedback) && feedback.length > 0) {
        message = feedback[0]?.message || feedback[0]?.overall_assessment || message;
      } else if (typeof feedback === 'object' && feedback !== null) {
        message = feedback.message || feedback.overall_assessment || message;
      }

      throw new NotFoundException(message);
    }

    let raw = response.analysis.ai_feedback.raw_response ?? '{}';

    if (typeof raw === 'string') {
      raw = raw
        .replace(/^```json/, '')
        .replace(/```$/, '')
        .trim();
    }

    let parsedFeedback: any;
    try {
      if (typeof raw === 'string') {
        if (raw.trim().startsWith('<')) {
          throw new Error('AI service returned HTML error page');
        }
        parsedFeedback = JSON.parse(raw);
      } else {
        parsedFeedback = raw;
      }
    } catch (err) {
      console.error('AI feedback parsing failed:', err, { raw });
      parsedFeedback = {
        error: 'Invalid AI feedback response from service',
      };
    }

    const pitchAiGeneratedFeedback = JSON.stringify(parsedFeedback);
    const score = response.analysis.total_score ?? 0;

    if (!businessProgressScore.pitchFeedback && score === 0) {
      throw new InformationException('A score of zero cannot be saved. Please try again to achieve a higher score.');
    }

    if (response.score < (businessProgressScore.pitchFeedback ?? 0)) {
      throw new InformationException(
        `Your new score (${response.score}) is less than your earlier score (${businessProgressScore.pitchFeedback ?? 0}), so it won’t be updated. Keep your best score, and feel free to try again!`,
      );
    }
    return {
      id: input.businessId,
      pitchAiGeneratedFeedback,
      score,
      pitchPracticeVideoUrl: input.videoUrl,
    };
  }
}
