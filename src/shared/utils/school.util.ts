import { DateTime } from 'luxon';

export function generateCurrentAcademicYear(startMonth: number, endMonth: number, yearsAhead = 10) {
  const today = DateTime.local();

  let startYear: number;
  let endYear: number;

  if (startMonth <= endMonth) {
    startYear = today.year;
    endYear = today.year;
  } else {
    startYear = today.month >= startMonth ? today.year : today.year - 1;
    endYear = startYear + 1;
  }

  const startDate = DateTime.local(startYear, startMonth, 1);
  const endDate = DateTime.local(endYear, endMonth, DateTime.local(endYear, endMonth, 1).endOf('month').day);

  return {
    startYear,
    endYear,
    startDate: startDate.toISODate(),
    endDate: endDate.toISODate(),
  };
}
