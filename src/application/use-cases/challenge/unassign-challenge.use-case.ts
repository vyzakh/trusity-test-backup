import { ICurrentUser } from '@core/types';
import { ChallengeRepository, StudentRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';

interface UnAssignChallengeUseCaseInput {
  data: {
    challengeId: string;
    schoolId?: string;
    schoolGradeId?: string;
    schoolSectionIds?: string[];
    studentIds?: string[];
  };
  user: ICurrentUser;
}

export class UnAssignChallengeUseCase {
  constructor(
    private readonly dependencies: {
      studentRepo: StudentRepository;
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: UnAssignChallengeUseCaseInput): Promise<void> {
    const { studentRepo, challengeRepo } = this.dependencies;
    const { data, user } = input;

    const withScopeFilter = (query: Record<string, any>) => {
      if ([UserScope.SCHOOL_ADMIN, UserScope.TEACHER].includes(user.scope)) {
        query.schoolId = user.schoolId;
      }
      return query;
    };

    let studentIds: string[] = [];

    if (data.studentIds?.length) {
      studentIds = await studentRepo.getStudentIds(withScopeFilter({ studentIds: data.studentIds }));
    } else if (data.schoolId) {
      studentIds = await studentRepo.getStudentIds(withScopeFilter({ schoolId: data.schoolId }));
    } else if (data.schoolGradeId) {
      studentIds = await studentRepo.getStudentIds(withScopeFilter({ schoolGradeId: data.schoolGradeId }));
    } else if (data.schoolSectionIds?.length) {
      studentIds = await studentRepo.getStudentIds(withScopeFilter({ schoolSectionIds: data.schoolSectionIds }));
    }

    if (!studentIds.length) return;

    const toUnassign = studentIds.map((id) => ({
      challengeId: data.challengeId,
      studentId: id,
    }));

    await challengeRepo.unassignChallengeFromStudents(toUnassign);
  }
}
