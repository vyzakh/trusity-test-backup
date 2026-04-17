import { DateTime } from 'luxon';

export interface AcademicYearConfig {
  startMonth?: number;
  startDay?: number;
  endMonth?: number;
  endDay?: number;
  startDate?: string;
  endDate?: string;
  baseYear?: number;
}

export interface AcademicYear {
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
}

function generateAcademicYear(config: AcademicYearConfig, offset: number = 0): AcademicYear {
  const { startMonth, startDay = 1, endMonth, endDay, startDate: configStartDate, endDate: configEndDate, baseYear } = config;

  if (configStartDate && configEndDate) {
    const start = DateTime.fromISO(configStartDate);
    const end = DateTime.fromISO(configEndDate);

    const offsetStart = start.plus({ years: offset });
    const offsetEnd = end.plus({ years: offset });

    return {
      startYear: offsetStart.year,
      endYear: offsetEnd.year,
      startDate: offsetStart.toISODate()!,
      endDate: offsetEnd.toISODate()!,
    };
  }

  if (!startMonth || !endMonth) {
    throw new Error('Either provide startDate/endDate or startMonth/endMonth');
  }

  const todayDate = DateTime.local().startOf('day');
  const crossesYear = startMonth > endMonth;

  let anchorYear: number;

  if (baseYear) {
    anchorYear = baseYear;
  } else if (!crossesYear) {
    anchorYear = todayDate.year;
  } else {
    const currentYearStart = DateTime.local(todayDate.year, startMonth, startDay).startOf('day');

    anchorYear = todayDate.toMillis() >= currentYearStart.toMillis() ? todayDate.year : todayDate.year - 1;
  }

  const startYear = anchorYear + offset;
  const endYear = crossesYear ? startYear + 1 : startYear;

  const startDate = DateTime.local(startYear, startMonth, startDay);

  const resolvedEndDay = endDay ?? DateTime.local(endYear, endMonth, 1).endOf('month').day;

  const endDate = DateTime.local(endYear, endMonth, resolvedEndDay);

  return {
    startYear,
    endYear,
    startDate: startDate.toISODate()!,
    endDate: endDate.toISODate()!,
  };
}

export function generateAcademicYears(config: AcademicYearConfig, count: number = 10, startOffset: number = 0) {
  const years: AcademicYear[] = [];

  for (let i = 0; i < count; i++) {
    years.push(generateAcademicYear(config, startOffset + i));
  }

  return years;
}

export function getCurrentAcademicYear(config: AcademicYearConfig): AcademicYear {
  return generateAcademicYear(config, 0);
}

export function getNextAcademicYear(config: AcademicYearConfig): AcademicYear {
  return generateAcademicYear(config, 1);
}

export function getPreviousAcademicYear(config: AcademicYearConfig): AcademicYear {
  return generateAcademicYear(config, -1);
}
