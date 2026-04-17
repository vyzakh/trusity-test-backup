import { ICurrentUser } from '@core/types';
import { BadgeRepository } from '@infrastructure/database/repositories/badge.repository';

interface UpdateBadgeUseCaseInput {
  data: {
    badges: {
      levelKey: string;
      minPercentage: number;
    }[];
  };
  user: ICurrentUser;
}

export class UpdateBadgeUseCase {
  constructor(private readonly dependencies: { badgeRepository: BadgeRepository }) {}

  async execute(inputs: UpdateBadgeUseCaseInput) {
    const { badgeRepository } = this.dependencies;
    const { data } = inputs;

    await badgeRepository.updateBadges(data.badges);
  }
}
