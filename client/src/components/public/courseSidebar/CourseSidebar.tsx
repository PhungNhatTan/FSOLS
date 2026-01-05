import { useEffect, useState } from "react";
import type { CourseNavData } from "../../../types/course";
import ModuleList from "./ModuleList";

interface CourseSidebarProps {
  courseData: CourseNavData;
  currentItemId: string | null;
  completedItems: Set<string>;
  progress: number;
  onSelectItem: (itemId: string) => void;
  onBack: () => void;
}

export default function CourseSidebar({
  courseData,
  currentItemId,
  completedItems,
  progress,
  onSelectItem,
  onBack,
}: CourseSidebarProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  // Auto-expand module containing current item
  useEffect(() => {
    if (currentItemId && courseData?.CourseModule) {
      for (const module of courseData.CourseModule) {
        const hasCurrentItem = module.ModuleItems?.some((item) => {
          const lessons = item.CourseLesson || [];
          const exams = item.Exam || [];
          
          return (
            lessons.some((l) => `lesson-${l.Id}` === currentItemId) ||
            exams.some((e) => `exam-${e.Id}` === currentItemId)
          );
        });
        
        if (hasCurrentItem) {
          setExpanded(module.Id);
          break;
        }
      }
    }
  }, [currentItemId, courseData]);

  const handleToggle = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-300 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <button
          onClick={onBack}
          className="text-blue-600 hover:underline mb-4 text-sm"
        >
          ← Back to Courses
        </button>
        
        <h2 className="text-xl font-bold mb-2 text-gray-800">
          Course Navigation
        </h2>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto p-4">
        {courseData?.CourseModule && (
          <ModuleList
            modules={courseData.CourseModule}
            expanded={expanded}
            onToggle={handleToggle}
            currentItemId={currentItemId}
            completedItems={completedItems}
            onSelectItem={onSelectItem}
          />
        )}
      </div>
    </aside>
  );
}