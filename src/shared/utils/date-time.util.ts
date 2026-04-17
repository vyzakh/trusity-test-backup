import { DateTime, DurationLikeObject } from 'luxon';

export function genTimestamp(duration?: DurationLikeObject) {
  const dateTime = duration ? DateTime.utc().plus(duration) : DateTime.utc();

  return {
    iso: dateTime.toISO(),
    human: dateTime.toFormat("MMM dd, yyyy HH:mm 'UTC'"),
    dmyDash: dateTime.toFormat('dd-MM-yyyy'),
    relative: dateTime.toRelative(),
    millis: dateTime.toMillis(),
  };
}

export function getTimestampStatus(timestamp: string | Date | DateTime) {
  let dateTime: DateTime;

  if (typeof timestamp === 'string' || timestamp instanceof Date) {
    dateTime = DateTime.fromJSDate(new Date(timestamp));
  } else if (timestamp instanceof DateTime) {
    dateTime = timestamp;
  } else {
    return { isValid: false, isFuture: false, isExpired: true };
  }

  const now = DateTime.utc();
  const isValid = dateTime.isValid;
  const isFuture = isValid && dateTime.toUTC() > now;
  const isExpired = isValid && dateTime.toUTC() <= now;

  return { isValid, isFuture, isExpired };
}
