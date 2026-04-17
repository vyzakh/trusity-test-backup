import { BusinessModelEnum } from '@shared/enums';
import { z } from 'zod';

export const CreateB2BStudentSchema = z.object({
  accountType: z.literal(BusinessModelEnum.B2B),
  schoolId: z.string().regex(/^\d+$/).nullish(),
  name: z.string().min(1).max(100),
  email: z
    .string()
    .email()
    .max(255)
    .transform((val) => val.toLowerCase()),
  contactNumber: z.string().min(1),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }),
  guardian: z
    .object({
      name: z.string().min(1).max(100),
      email: z
        .string()
        .email()
        .max(255)
        .transform((val) => val.toLowerCase()),
      contactNumber: z.string().min(1),
    })
    .strict(),
  gradeId: z.number(),
  sectionId: z.number(),
  avatarUrl: z.string().url().nullish(),
});

export const CreateStudentSchema = z
  .object({
    accountType: z.nativeEnum(BusinessModelEnum),

    name: z.string().min(1).max(100),
    email: z
      .string()
      .email()
      .max(255)
      .transform((val) => val.toLowerCase()),
    contactNumber: z.string().min(1),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date < new Date();
      }),
    guardian: z.object({
      name: z.string().min(1).max(100),
      email: z
        .string()
        .email()
        .max(255)
        .transform((val) => val.toLowerCase()),
      contactNumber: z.string().min(1),
    }),
    gradeId: z.number(),
    sectionId: z.number(),
    avatarUrl: z.string().url().nullish(),

    schoolId: z.string().regex(/^\d+$/).nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === BusinessModelEnum.B2B) {
      return;
    }
    if (data.accountType === BusinessModelEnum.B2C) {
      if (!data.schoolId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'schoolId is required for B2C students',
          path: ['schoolId'],
        });
      }
    }
  });

const normalizePhone = (phone: string | number): string => {
  const phoneStr = String(phone).replace(/[\s\-()]/g, '');
  const cleaned = phoneStr.replace(/\+/g, '');
  return phoneStr.startsWith('+') ? `+${cleaned}` : cleaned;
};

const normalizeDate = (date: string | number | Date): string => {
  if (date instanceof Date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
  }

  // If it's an Excel serial date number
  if (typeof date === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const dateObj = new Date(excelEpoch.getTime() + date * 86400000);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${year}/${month}/${day}`;
  }

  // If it's a string, try to parse and convert to YYYY/MM/DD
  const dateStr = String(date);

  // Handle DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}/${month}/${day}`;
  }

  // Handle YYYY/MM/DD format (already correct)
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Handle other common formats
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${year}/${month}/${day}`;
  }

  return dateStr;
};

export const BulkUploadStudentSchema = z.object({
  Name: z
    .string()
    .min(1, 'Name is required')
    .transform((val) => val.trim()),

  Email: z
    .string()
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),

  ContactNumber: z
    .union([z.string(), z.number()])
    .transform(normalizePhone)
    .pipe(
      z
        .string()
        .regex(/^\+?\d+$/, 'Contact number must contain only digits (+ allowed at start)')
        .min(10, 'Contact number must be at least 10 digits')
        .max(16, 'Contact number must not exceed 16 characters'),
    ),

  DateOfBirth: z
    .union([z.string(), z.number(), z.date()])
    .transform(normalizeDate)
    .pipe(z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'Date must be in YYYY/MM/DD format')),

  GuardianName: z
    .string()
    .min(1, 'Guardian name is required')
    .transform((val) => val.trim()),

  GuardianContactNumber: z
    .union([z.string(), z.number()])
    .transform(normalizePhone)
    .pipe(
      z
        .string()
        .regex(/^\+?\d+$/, 'Guardian contact number must contain only digits (+ allowed at start)')
        .min(10, 'Guardian contact number must be at least 10 digits')
        .max(16, 'Guardian contact number must not exceed 16 characters'),
    ),

  GuardianEmail: z
    .string()
    .email('Invalid guardian email format')
    .transform((val) => val.toLowerCase().trim()),

  Grade: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .pipe(z.string().regex(/^\d+$/, 'Grade must be a number')),

  Section: z
    .string()
    .min(1, 'Section is required')
    .transform((val) => val.trim().toUpperCase()),
});

export const BulkUploadStudentsSchema = z.array(BulkUploadStudentSchema);
