// src/pages/index.ts
export { default as CourseStudyPage } from "./CourseStudyPage";
export { default as LessonPage } from "../components/lesson/LessonPage";
export { default as ExamPage } from "../components/exam/ExamPage";
export { default as ExamDetailDisplay} from "../components/exam/ExamDetailDisplay";

export interface PageProps {
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
}
