import { BusinessModelEnum, BusinessSource } from '@shared/enums';
import { BusinessStatus } from '@shared/enums/business-status.enum';
import z from 'zod';

export const BusinessIdeasSchema = z.object({
  keywords: z.string().min(1).max(1500),
  sdgIds: z.array(z.number()).min(1).max(2),
});

export const BusinessesSchema = z.object({
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).optional(),
  schoolId: z.string().regex(/^\d+$/).optional(),
  countryId: z.string().regex(/^\d+$/).optional(),
  accountType: z.nativeEnum(BusinessModelEnum).optional(),
  academicYearId: z.string().regex(/^\d+$/).optional(),
  studentId: z.string().regex(/^\d+$/).optional(),
  name: z.string().min(1).optional(),
  status: z.nativeEnum(BusinessStatus).optional(),
  source: z.nativeEnum(BusinessSource).optional(),
});

export const TotalBusinessesSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
  studentId: z.string().regex(/^\d+$/).optional(),
  businessName: z.string().min(1).optional(),
  status: z.nativeEnum(BusinessStatus).optional(),
  source: z.nativeEnum(BusinessSource).optional(),
});

export const UpdateBusinessSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  businessName: z.string().min(1).max(150).optional(),
  idea: z.string().min(1).max(1500).optional(),
  sdgIds: z.array(z.number()).min(1).max(2).optional(),
});
