// Course time-limit helpers.
//
// Implementation choice: NO DB schema changes.
//
// Rules:
// - Countdown starts at CourseEnroll.EnrolledAt.
// - When time expires, we 'kick' the student by setting CourseEnroll.DeletedAt = expiresAt.
// - Re-enroll becomes available after endAt + cooldownMinutes, where endAt is:
//     - DeletedAt (manual unenroll or already-kicked)
//     - otherwise expiresAt (when we detect expiry)

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_SECOND = 1000;

function toInt(value, fallback) {
  const n = Number(value);
  if (Number.isFinite(n)) return Math.trunc(n);
  return fallback;
}

export function getCourseTimeConfig() {
  // Set to 0 to disable the corresponding behavior.
  const studyWindowMinutes = Math.max(0, toInt(process.env.COURSE_STUDY_DURATION_MINUTES, 60));
  const reenrollCooldownMinutes = Math.max(0, toInt(process.env.COURSE_REENROLL_COOLDOWN_MINUTES, 60));
  return { studyWindowMinutes, reenrollCooldownMinutes };
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

export function ceilSecondsBetween(a, b) {
  // seconds from a -> b
  const ms = b.getTime() - a.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / MS_PER_SECOND);
}

export function formatDurationHMS(totalSeconds) {
  const s = Math.max(0, Math.trunc(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

export function computeEnrollmentTimeState(enrollment, now = new Date(), cfg = getCourseTimeConfig()) {
  const { studyWindowMinutes, reenrollCooldownMinutes } = cfg;

  const enrolledAt = new Date(enrollment.EnrolledAt);
  const isCompleted = enrollment.Status === 'Completed';

  const hasLimit = studyWindowMinutes > 0 && !isCompleted;
  const expiresAt = hasLimit ? addMinutes(enrolledAt, studyWindowMinutes) : null;

  const deletedAt = enrollment.DeletedAt ? new Date(enrollment.DeletedAt) : null;

  const isExpired = Boolean(expiresAt) && now.getTime() >= expiresAt.getTime();

  // If already deleted (manual unenroll or previous kick), use DeletedAt as endAt.
  // Otherwise, if expired, endAt is expiresAt.
  const endAt = deletedAt || (isExpired ? expiresAt : null);

  const canEnrollAt = endAt && reenrollCooldownMinutes > 0 ? addMinutes(endAt, reenrollCooldownMinutes) : null;

  const secondsRemaining = expiresAt ? ceilSecondsBetween(now, expiresAt) : 0;
  const cooldownSecondsRemaining = canEnrollAt ? ceilSecondsBetween(now, canEnrollAt) : 0;

  const isCooldownActive = cooldownSecondsRemaining > 0;

  // Active if not deleted AND (no limit OR not expired OR completed)
  const isActive = !deletedAt && (!hasLimit || !isExpired || isCompleted);

  return {
    studyWindowMinutes,
    reenrollCooldownMinutes,
    hasLimit,
    isCompleted,
    enrolledAt,
    expiresAt,
    isExpired,
    deletedAt,
    endAt,
    canEnrollAt,
    secondsRemaining,
    cooldownSecondsRemaining,
    isCooldownActive,
    isActive,
  };
}
