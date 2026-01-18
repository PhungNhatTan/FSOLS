import type { Lesson } from "../../../types/lesson";

interface LessonUploadFormProps {
  courseId?: number;
  moduleId?: number;
  onSuccess?: (lesson: Lesson) => void;
  onError?: (error: string) => void;
  showCourseModuleSelect?: boolean;
}

/**
 * Deprecated: FSOLS uses LessonResource via the course draft workflow.
 * This component previously uploaded files using legacy CourseLesson fields.
 */
export default function LessonUploadForm(_props: LessonUploadFormProps) {
  if (_props.courseId == null || _props.moduleId == null) { 
    // placeholder to avoid unused variable error
    // do nothing
  };
  return (
    <div className="p-4 rounded border border-yellow-300 bg-yellow-50 text-yellow-900">
      <div className="font-semibold">Lesson upload is deprecated.</div>
      <div className="text-sm mt-2">
        Please manage lesson files via the course draft editor (LessonResource). The legacy CourseLesson upload API is
        intentionally disabled.
      </div>
    </div>
  );
}
