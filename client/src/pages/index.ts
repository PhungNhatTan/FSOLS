// src/pages/index.ts
export { default as CourseStudyPage } from "./CourseStudyPage";
export { default as LessonPage } from "../components/public/lesson/LessonPage";
export { default as ExamPage } from "../components/public/exam/ExamPage";
export { default as ExamDetailDisplay} from "../components/public/exam/ExamDetailDisplay";

export interface PageProps {
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
}
