export interface LessonSummary {
  Id: number;
  Title: string;
}

export interface LessonDetail extends LessonSummary {
  LessonType: string;
  Content: string;
}
