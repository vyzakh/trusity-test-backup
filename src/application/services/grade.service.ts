import { DatabaseService, LookupRepository } from '@infrastructure/database';
import { Logger } from '@nestjs/common';

export class GradeService {
  private gradesCache: {
    id: number;
    rank: number;
    name: string;
  }[] = [];
  private logger = new Logger(GradeService.name);

  constructor(private readonly dbService: DatabaseService) {}

  async loadGrades() {
    await this.dbService.runUnitOfWork({
      buildDependencies: async (params) => {
        return {
          lookupRepo: new LookupRepository(params.db),
        };
      },
      callback: async (deps) => {
        this.gradesCache = await deps.lookupRepo.findAllGrades();
        this.logger.log(`Grades loaded and cached: ${this.gradesCache.length}`);
      },
    });
  }

  async getNextGradeId(currentGradeId: number): Promise<number | null> {
    if (!this.gradesCache.length) {
      await this.loadGrades();
    }

    const currentGrade = this.gradesCache.find((g) => g.id === currentGradeId);
    if (!currentGrade) {
      this.logger.warn(`Current gradeId ${currentGradeId} not found`);
      return null;
    }

    const nextGrade = this.gradesCache.find((g) => g.rank > currentGrade.rank);
    if (!nextGrade) {
      this.logger.log(`Grade ${currentGrade.name} is the highest grade`);
      return null;
    }

    return nextGrade.id;
  }
}
