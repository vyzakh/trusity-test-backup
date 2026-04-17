import { AiPerformanceFeedbackService } from '@application/services';
import { ICurrentUser } from '@core/types';
import { AiPerformanceFeedbackRepository, BusinessRepository, SchoolRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';

interface GetGradePerformanceAiFeedbackUseCaseInput {
  data: {
    schoolId?: string;
    gradeIds: number[];
    sectionIds?: number[];
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class GetGradePerformanceAiFeedbackUseCase {
  constructor(
    private readonly deps: {
      businessRepo: BusinessRepository;
      schoolRepo: SchoolRepository;
      aiPerformanceFeedbackService: AiPerformanceFeedbackService;
      aiPerformanceFeedbackRepo: AiPerformanceFeedbackRepository;
    },
  ) {}

  async execute(input: GetGradePerformanceAiFeedbackUseCaseInput) {
    const { businessRepo, schoolRepo, aiPerformanceFeedbackService, aiPerformanceFeedbackRepo } = this.deps;
    const { data, user } = input;

    const query: Record<string, any> = {
      schoolId: data.schoolId,
      gradeIds: data.gradeIds,
      sectionIds: data.sectionIds,
      status: data.status,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT: {
        Object.assign(query, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    if (data.gradeIds.length == 1 && data.sectionIds?.length) {
      query.gradeId = data.gradeIds[0];

      const gradePerformanceProgression = await businessRepo.getGradePerformanceProgression(query);
      if (!gradePerformanceProgression) {
        return null;
      }

      const sections = await schoolRepo.getSchoolGradeSections(query);
      const grade = await schoolRepo.getSchoolGrade(query);

      const sectionNames = sections.map((s) => `${grade?.name ?? ''}${s.section.name}`);

      const { feedback } = await aiPerformanceFeedbackService.getGradeFeedback({
        grades: sectionNames,
        scores: gradePerformanceProgression,
      });

      const { id } = await aiPerformanceFeedbackRepo.createFeedback({
        feedback,
      });

      return { feedback, feedbackId: id };
    }

    if (data.gradeIds.length >= 1 && !data.sectionIds?.length) {
      if (data.sectionIds?.length) {
        throw new NotFoundException('Section selection is not allowed when multiple grades are selected');
      }

      const gradePerformanceProgression = await businessRepo.getSchoolPerformanceProgression({
        schoolId: query.schoolId,
        gradeIds: query.gradeIds,
      });

      const grades = await schoolRepo.getSchoolGrades({
        schoolId: query.schoolId,
        gradeIds: query.gradeIds,
      });

      const gradeNames = grades.map((g) => `${g.grade.name}`);

      const { feedback } = await aiPerformanceFeedbackService.getGradeFeedback({
        grades: gradeNames,
        scores: gradePerformanceProgression,
      });

      const { id } = await aiPerformanceFeedbackRepo.createFeedback({
        feedback,
      });

      return { feedback, feedbackId: id };
    }
  }
}
