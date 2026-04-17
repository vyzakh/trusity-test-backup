import { BadgeRepository } from '@infrastructure/database/repositories';
import { Badge } from '@presentation/graphql/modules/badge/types/badge.type';

export class GetBadgesUseCase {
  constructor(private readonly dependencies: { badgeRepository: BadgeRepository }) {}

  async execute(): Promise<Badge[]> {
    return this.dependencies.badgeRepository.getBadges();
  }
}
