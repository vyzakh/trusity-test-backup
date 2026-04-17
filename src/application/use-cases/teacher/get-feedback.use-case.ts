import { ICurrentUser } from '@core/types';
import { TeacherRepository } from '@infrastructure/database';

interface GetFeedbackInput {
  data: {
    feedbackId: string;
  };
  user: ICurrentUser;
}
export class GetFeedbackUseCase {
  constructor(
    private readonly dependencies: {
      teacherRepo: TeacherRepository;
    },
  ) {}

  async execute(input: GetFeedbackInput) {
    const { data } = input;
    const { teacherRepo } = this.dependencies;

    const feedback = await teacherRepo.getFeedbackById({ id: data.feedbackId });

    return feedback;
  }
}
