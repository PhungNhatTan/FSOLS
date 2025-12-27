// client/src/utils/timeEstimate.ts
type LessonLike = {
  LessonType?: string
  Content?: string
}

const stripHtmlToText = (html: string): string => {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ")
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body?.textContent ?? "").trim()
}

const countWords = (text: string): number => {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

export const estimateLessonMinutes = (lesson: LessonLike): number => {
  const type = (lesson.LessonType ?? "").toLowerCase()
  const html = lesson.Content ?? ""
  const words = countWords(stripHtmlToText(html))

  // ít chữ (video/doc embed) -> fallback
  if (words < 30) {
    if (type.includes("video")) return 10
    if (type.includes("doc") || type.includes("pdf")) return 8
    return 5
  }

  // có chữ -> reading time + buffer
  const wpm = 170
  const reading = Math.max(2, Math.ceil(words / wpm))
  const buffer = Math.min(5, Math.ceil(reading * 0.25))
  return reading + buffer
}

export const formatMinutes = (minutes: number): string => {
  const m = Math.max(0, Math.floor(minutes))
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h <= 0) return `${mm}m`
  if (mm === 0) return `${h}h`
  return `${h}h ${mm}m`
}
