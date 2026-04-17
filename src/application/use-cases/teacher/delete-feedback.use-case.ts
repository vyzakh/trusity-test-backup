import { ICurrentUser } from '@core/types';
import { TeacherRepository } from '@infrastructure/database';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';

interface DeleteFeedbackInput {
  data: {
    feedbackId: string;
  };
  user: ICurrentUser;
}

export class DeleteFeedbackUseCase {
  constructor(
    private readonly dependencies: {
      teacherRepo: TeacherRepository;
    },
  ) {}

  async execute(input: DeleteFeedbackInput) {
    const { data, user } = input;
    const { teacherRepo } = this.dependencies;

    const existingFeedback = await teacherRepo.getFeedbackById({ id: data.feedbackId });

    if (!existingFeedback) {
      throw new NotFoundException(`Feedback not found`);
    }

    if (existingFeedback.teacherId !== user.id) {
      throw new ForbiddenException('You can only delete your own feedback');
    }
    const deletedFeedback = await teacherRepo.deleteFeedback({ id: data.feedbackId });

    return deletedFeedback;
  }
}
