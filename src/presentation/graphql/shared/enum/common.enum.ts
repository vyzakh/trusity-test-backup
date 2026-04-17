import { registerEnumType } from '@nestjs/graphql';
import {
  BusinessModelEnum,
  BusinessPhaseEnum,
  BusinessSource,
  ChallengeCreatorType,
  ChallengeParticipationEnum,
  ChallengeScope,
  ChallengeVisibility,
  FileType,
  PlatformUserRole,
  SchoolStatus,
  SchoolStatusAction,
  SortOrder,
  UserScope,
} from '@shared/enums';
import { DeckType } from '@shared/enums/business-deck-type.enum';
import { ComparisonOperator, IECType } from '@shared/enums/business-performance.enum';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { BusinessStatus } from '@shared/enums/business-status.enum';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';

registerEnumType(BusinessModelEnum, {
  name: 'BusinessModelEnum',
});

registerEnumType(EnrollmentStatusEnum, {
  name: 'EnrollmentStatusEnum',
});

registerEnumType(BusinessStatus, {
  name: 'BusinessStatus',
});

registerEnumType(SchoolStatus, {
  name: 'SchoolStatus',
});

registerEnumType(SchoolStatusAction, {
  name: 'SchoolStatusAction',
});

registerEnumType(SortOrder, {
  name: 'SortOrder',
});

registerEnumType(UserScope, {
  name: 'UserScope',
});

registerEnumType(PlatformUserRole, {
  name: 'PlatformUserRole',
});

registerEnumType(FileType, {
  name: 'FileType',
});

registerEnumType(ChallengeScope, {
  name: 'ChallengeScope',
});

registerEnumType(BusinessSource, {
  name: 'BusinessSource',
});

registerEnumType(ChallengeCreatorType, {
  name: 'ChallengeCreatorType',
});

registerEnumType(ChallengeParticipationEnum, {
  name: 'ChallengeParticipationEnum',
});

registerEnumType(ChallengeVisibility, {
  name: 'ChallengeVisibility',
});

registerEnumType(BusinessPhaseStepEnum, {
  name: 'BusinessPhaseStepEnum',
});

registerEnumType(IECType, {
  name: 'IECType',
});

registerEnumType(ComparisonOperator, {
  name: 'ComparisonOperator',
});

registerEnumType(DeckType, {
  name: 'DeckType',
});

registerEnumType(BusinessPhaseEnum, {
  name: 'BusinessPhaseEnum',
});