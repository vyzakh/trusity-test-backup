import { ICurrentUser } from '@core/types';
import { BusinessRepository, StudentRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException } from '@shared/execeptions';

interface GetGradePerformanceProgressionUseCaseInput {
  data: {
    schoolId?: string;
    gradeId?: number;
    gradeIds?: number[];
    sectionIds?: number[];
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class GetGradePerformanceProgressionUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}
  async execute(input: GetGradePerformanceProgressionUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;
    let schoolId = data.schoolId;

    switch (user.scope) {
      case UserScope.PLATFORM_USER:
        break;

      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT:
        schoolId = user.schoolId;
        break;

      default:
        throw new ForbiddenException('You are not allowed to perform this action.');
    }

    if (data.gradeIds?.length) {
      if (data.sectionIds?.length) {
        throw new BadRequestException('Section selection is not allowed when multiple grades are selected');
      }
      console.log("scenario 2")

      return await businessRepo.getSchoolPerformanceProgression({
        schoolId,
        gradeIds: data.gradeIds,
        status: data.status,
      });
    }
    if (!data.gradeId) {
      throw new BadRequestException('gradeId is required');
    }

    return businessRepo.getGradePerformanceProgression({
      schoolId,
      gradeId: data.gradeId,
      sectionIds: data.sectionIds,
      status: data.status,
    });
  }
}
