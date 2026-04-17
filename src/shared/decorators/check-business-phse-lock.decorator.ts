import { SetMetadata } from "@nestjs/common";
import { BusinessPhaseEnum } from "@shared/enums/business-phase.enum";

export const BUSINESS_PHASE_KEY = Symbol('BUSINESS_PHASE_KEY');

export const CheckBusinessPhaseLock = (phase: BusinessPhaseEnum) =>  SetMetadata(BUSINESS_PHASE_KEY, phase);