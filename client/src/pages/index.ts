// src/pages/index.ts
export { default as CourseStudyPage } from "./CourseStudyPage";
export { default as LessonPage } from "../components/public/lesson/LessonPage";
export { default as ExamPage } from "../components/public/exam/ExamPage";
export { default as ExamDetailDisplay} from "../components/public/exam/ExamDetailDisplay";
export { default as HomePage } from "./public/HomePage";
export { default as LoginPage } from "./public/LoginPage";
export { default as RegisterPage } from "./public/RegisterPage";
export { default as CourseDetailPage } from "./public/CourseDetailPage";
export { default as CoursePage } from "./public/CoursePage";

export interface PageProps {
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
}
