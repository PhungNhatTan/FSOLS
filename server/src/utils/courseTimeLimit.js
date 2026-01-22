// Course time-limit helpers.
//
// Implementation choice: NO DB schema changes.
//
// Core rules:
// - Countdown starts at CourseEnroll.EnrolledAt.
// - When time expires, we 'kick' the student by setting CourseEnroll.DeletedAt = expiresAt.
// - Re-enroll becomes available after endAt + cooldown, where endAt is:
//     - DeletedAt (manual unenroll or already-kicked)
//     - otherwise expiresAt (when we detect expiry)
//
// Time-limit policy:
// - Per-course time limit is computed in DAYS (studyWindowDays) based on course workload (minutes),
//   unless an override is provided.
// - Backward compatibility: if COURSE_STUDY_DURATION_MINUTES is set, it becomes a global override.

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
// const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

function toIntOrNull(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isFinite(n)) return Math.trunc(n);
  return null;
}

function toFloatOrNull(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isFinite(n)) return n;
  return null;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function presetToMinutes(preset) {
  switch (preset) {
    case 'P_15':
      return 15;
    case 'P_30':
      return 30;
    case 'P_60':
      return 60;
    case 'P_90':
      return 90;
    case 'P_120':
      return 120;
    default:
      return 0;
  }
}

export function getCourseTimeConfig() {
  // Overrides (useful for tests).
  const studyWindowOverrideSeconds = Math.max(0, toIntOrNull(process.env.COURSE_STUDY_WINDOW_OVERRIDE_SECONDS) ?? 0);
  const reenrollCooldownOverrideSeconds = Math.max(
    0,
    toIntOrNull(process.env.COURSE_REENROLL_COOLDOWN_OVERRIDE_SECONDS) ?? 0
  );

  // Legacy global (minutes) overrides.
  // If set, we use them instead of the per-course formula.
  const legacyStudyWindowMinutes = toIntOrNull(process.env.COURSE_STUDY_DURATION_MINUTES);
  const legacyReenrollCooldownMinutes = toIntOrNull(process.env.COURSE_REENROLL_COOLDOWN_MINUTES);

  // Per-course formula knobs.
  const dailyStudyMinutes = Math.max(1, toIntOrNull(process.env.COURSE_DAILY_STUDY_MINUTES) ?? 60);
  const bufferMultiplier = Math.max(0, toFloatOrNull(process.env.COURSE_TIME_LIMIT_BUFFER) ?? 1.5);
  // minDays must be >= 1, otherwise studyWindowSeconds can become 0 and disable the limit.
  const minDays = Math.max(1, toIntOrNull(process.env.COURSE_TIME_LIMIT_MIN_DAYS) ?? 1);
  const maxDays = Math.max(minDays, toIntOrNull(process.env.COURSE_TIME_LIMIT_MAX_DAYS) ?? 90);


  // Cooldown policy (days) when legacy minutes not set.
  const reenrollCooldownDays = Math.max(0, toIntOrNull(process.env.COURSE_REENROLL_COOLDOWN_DAYS) ?? 1);

  // Workload estimation defaults.
  const defaultVideoMinutes = Math.max(0, toIntOrNull(process.env.COURSE_DEFAULT_VIDEO_MINUTES) ?? 10);
  const defaultDocumentMinutes = Math.max(0, toIntOrNull(process.env.COURSE_DEFAULT_DOCUMENT_MINUTES) ?? 5);
  const defaultUnknownItemMinutes = Math.max(0, toIntOrNull(process.env.COURSE_DEFAULT_UNKNOWN_ITEM_MINUTES) ?? 5);

  return {
    // overrides
    studyWindowOverrideSeconds,
    reenrollCooldownOverrideSeconds,

    // legacy
    legacyStudyWindowMinutes,
    legacyReenrollCooldownMinutes,

    // formula
    dailyStudyMinutes,
    bufferMultiplier,
    minDays,
    maxDays,

    // cooldown
    reenrollCooldownDays,

    // workload fallbacks
    defaultVideoMinutes,
    defaultDocumentMinutes,
    defaultUnknownItemMinutes,
  };
}

export function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * MS_PER_SECOND);
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

/**
 * Load the minimal course structure needed to compute time limits.
 *
 * Note: pass a Prisma client or transaction (prisma / tx).
 */
export async function loadCourseTimeLimitData(db, courseId) {
  if (!courseId) return null;
  return db.course.findUnique({
    where: { Id: Number(courseId) },
    select: {
      Id: true,
      CourseModule: {
        where: { DeletedAt: null },
        select: {
          Id: true,
          ModuleItems: {
            where: { DeletedAt: null },
            select: {
              Id: true,
              EstimatedDuration: true, // minutes
              Exam: {
                where: { DeletedAt: null },
                select: {
                  DurationPreset: true,
                  DurationCustom: true,
                },
              },
              CourseLesson: {
                where: { DeletedAt: null },
                select: {
                  LessonType: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Compute total course workload in minutes.
 * Preference order:
 *  1) ModuleItem.EstimatedDuration (if present)
 *  2) Sum of attached exams' durations (custom/preset)
 *  3) Sum of attached lessons (defaults by LessonType)
 *  4) defaultUnknownItemMinutes
 */
export function computeCourseWorkloadMinutes(courseData, cfg = getCourseTimeConfig()) {
  if (!courseData?.CourseModule?.length) return 0;

  let total = 0;

  for (const mod of courseData.CourseModule) {
    const items = mod?.ModuleItems || [];
    for (const it of items) {
      const estimated = Number(it?.EstimatedDuration);
      if (Number.isFinite(estimated) && estimated > 0) {
        total += Math.trunc(estimated);
        continue;
      }

      let itemMinutes = 0;

      // exams
      const exams = it?.Exam || [];
      for (const ex of exams) {
        const custom = Number(ex?.DurationCustom);
        if (Number.isFinite(custom) && custom > 0) {
          itemMinutes += Math.trunc(custom);
          continue;
        }
        const preset = ex?.DurationPreset;
        itemMinutes += presetToMinutes(preset);
      }

      // lessons
      const lessons = it?.CourseLesson || [];
      for (const lesson of lessons) {
        if (lesson?.LessonType === 'Document') itemMinutes += cfg.defaultDocumentMinutes;
        else if (lesson?.LessonType === 'Video') itemMinutes += cfg.defaultVideoMinutes;
        else itemMinutes += cfg.defaultUnknownItemMinutes;
      }

      if (itemMinutes <= 0) itemMinutes = cfg.defaultUnknownItemMinutes;
      total += itemMinutes;
    }
  }

  return Math.max(0, Math.trunc(total));
}

/**
 * Compute per-course study window.
 *
 * Returns:
 *  - totalMinutes
 *  - studyWindowDays (null when overridden by seconds)
 *  - studyWindowSeconds
 */
export function computeCourseStudyWindow(courseData, cfg = getCourseTimeConfig()) {
  // 1) Absolute override (seconds)
  if (cfg.studyWindowOverrideSeconds > 0) {
    return {
      totalMinutes: computeCourseWorkloadMinutes(courseData, cfg),
      studyWindowDays: null,
      studyWindowSeconds: cfg.studyWindowOverrideSeconds,
    };
  }

  // 2) Legacy global override (minutes)
  if (cfg.legacyStudyWindowMinutes !== null && cfg.legacyStudyWindowMinutes > 0) {
    const sec = Math.max(0, cfg.legacyStudyWindowMinutes) * 60;
    return {
      totalMinutes: computeCourseWorkloadMinutes(courseData, cfg),
      studyWindowDays: Math.ceil(sec / (24 * 60 * 60)),
      studyWindowSeconds: sec,
    };
  }

  // 3) Per-course formula
  const totalMinutes = computeCourseWorkloadMinutes(courseData, cfg);

  // If the course has no content, still apply a conservative window (minDays)
  const rawDays = totalMinutes > 0 ? totalMinutes / cfg.dailyStudyMinutes : 0;
  const computedDays = Math.ceil(rawDays * cfg.bufferMultiplier);

  // If computedDays is 0 (no workload or tiny workload), use minDays (>= 1)
  const baseDays = computedDays > 0 ? computedDays : cfg.minDays;

  const days = clamp(baseDays, cfg.minDays, cfg.maxDays);
  const seconds = days * 24 * 60 * 60;


  return {
    totalMinutes,
    studyWindowDays: days,
    studyWindowSeconds: seconds,
  };
}

function resolveCooldownSeconds(cfg) {
  if (cfg.reenrollCooldownOverrideSeconds > 0) return cfg.reenrollCooldownOverrideSeconds;
  if (cfg.legacyReenrollCooldownMinutes !== null && cfg.legacyReenrollCooldownMinutes > 0) {
    return cfg.legacyReenrollCooldownMinutes * 60;
  }
  return cfg.reenrollCooldownDays * 24 * 60 * 60;
}

/**
 * Compute time state for an enrollment.
 *
 * IMPORTANT: pass the per-course studyWindowSeconds, computed via computeCourseStudyWindow(...).
 */
export function computeEnrollmentTimeState(
  enrollment,
  now = new Date(),
  cfg = getCourseTimeConfig(),
  studyWindowSeconds = null
) {
  const enrolledAt = new Date(enrollment.EnrolledAt);
  const isCompleted = enrollment.Status === 'Completed';

  const effectiveStudyWindowSeconds =
    typeof studyWindowSeconds === 'number' && Number.isFinite(studyWindowSeconds)
      ? Math.max(0, Math.trunc(studyWindowSeconds))
      : 0;

  const cooldownSeconds = resolveCooldownSeconds(cfg);

  const hasLimit = effectiveStudyWindowSeconds > 0 && !isCompleted;
  const expiresAt = hasLimit ? addSeconds(enrolledAt, effectiveStudyWindowSeconds) : null;

  const deletedAt = enrollment.DeletedAt ? new Date(enrollment.DeletedAt) : null;
  const isExpired = Boolean(expiresAt) && now.getTime() >= expiresAt.getTime();

  // If already deleted (manual unenroll or previous kick), use DeletedAt as endAt.
  // Otherwise, if expired, endAt is expiresAt.
  const endAt = deletedAt || (isExpired ? expiresAt : null);

  const canEnrollAt = endAt && cooldownSeconds > 0 ? addSeconds(endAt, cooldownSeconds) : null;

  const secondsRemaining = expiresAt ? ceilSecondsBetween(now, expiresAt) : 0;
  const cooldownSecondsRemaining = canEnrollAt ? ceilSecondsBetween(now, canEnrollAt) : 0;
  const isCooldownActive = cooldownSecondsRemaining > 0;

  // Active if not deleted AND (no limit OR not expired OR completed)
  const isActive = !deletedAt && (!hasLimit || !isExpired || isCompleted);

  // Compatibility + reporting
  const studyWindowMinutes = Math.ceil(effectiveStudyWindowSeconds / 60);
  const studyWindowDays = Math.ceil(effectiveStudyWindowSeconds / (24 * 60 * 60));

  const reenrollCooldownMinutes = Math.ceil(cooldownSeconds / 60);
  const reenrollCooldownDays = Math.ceil(cooldownSeconds / (24 * 60 * 60));

  return {
    // study window
    studyWindowSeconds: effectiveStudyWindowSeconds,
    studyWindowMinutes,
    studyWindowDays,

    // cooldown
    reenrollCooldownSeconds: cooldownSeconds,
    reenrollCooldownMinutes,
    reenrollCooldownDays,

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
