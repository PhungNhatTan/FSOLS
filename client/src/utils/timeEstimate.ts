// client/src/utils/timeEstimate.ts
import { inferLessonKindFromResources, type ResourceLike } from "./mediaKind";

type LessonLike = {
  Content?: string;
  LessonResources?: ResourceLike[] | null;
  Resource?: ResourceLike | null;
};

/**
 * A lightweight, deterministic ETA estimator for UI only.
 * This is derived from LessonResource (file type) and optional rich text content.
 */
export const estimateLessonMinutes = (lesson: LessonLike): number => {
  const resources: ResourceLike[] = [];
  if (Array.isArray(lesson.LessonResources)) resources.push(...lesson.LessonResources);
  if (lesson.Resource) resources.unshift(lesson.Resource);

  const kind = inferLessonKindFromResources(resources);

  // Base by media kind
  let base = 7;
  if (kind === "video") base = 10;
  if (kind === "document") base = 8;

  // Add a small bump for rich text length (very rough)
  const textLen = typeof lesson.Content === "string" ? lesson.Content.trim().length : 0;
  if (textLen > 0) {
    base += Math.min(5, Math.ceil(textLen / 1200));
  }

  return Math.max(3, Math.min(30, base));
};
