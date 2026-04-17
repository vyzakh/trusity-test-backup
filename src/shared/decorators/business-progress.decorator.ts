import { SetMetadata } from '@nestjs/common';

export const RequireStages = (...stages: (keyof import('../guards/gql-business-progress.guard').BusinessProgressStatus)[]) => SetMetadata('requiredStages', stages);
