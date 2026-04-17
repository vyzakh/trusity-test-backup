import { SetMetadata } from '@nestjs/common';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';

export const BUSINESS_PHASE_STEP_KEY = Symbol('BUSINESS_PHASE_STEP_KEY');

export const BusinessPhaseStep = (step: BusinessPhaseStepEnum) => SetMetadata(BUSINESS_PHASE_STEP_KEY, step);
