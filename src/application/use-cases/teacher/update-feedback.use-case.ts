import { ICurrentUser } from '@core/types';
import { BusinessRepository, TeacherRepository } from '@infrastructure/database';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';

interface UpdateFeedbackInput {
  data: {
    id: string;
    businessId: string;
    feedback?: string;
    fileUrl?: string[];
  };
  user: ICurrentUser;
}

export class UpdateFeedbackUseCase {
  constructor(
    private readonly dependencies: {
      teacherRepo: TeacherRepository;
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: UpdateFeedbackInput) {
    const { data, user } = input;
    const { teacherRepo, businessRepo } = this.dependencies;

    const business = await businessRepo.getBusiness({ businessId: data.businessId });
    if (!business) {
      throw new NotFoundException(`Business does not exist`);
    }

    const existingFeedback = await teacherRepo.getFeedbackById({ id: data.id });

    if (!existingFeedback) {
      throw new NotFoundException('Feedback not found');
    }

    if (existingFeedback.teacherId !== user.id) {
      throw new ForbiddenException('You can only update your own feedback');
    }

    const updatedFeedback = await teacherRepo.updateFeedback({
      id: data.id,
      feedback: data.feedback,
      fileUrl: data.fileUrl || [],
    });
    return updatedFeedback;
  }
}
