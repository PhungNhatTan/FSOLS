import { useLocation } from "react-router-dom";
import type { ModuleItem } from "../../../types/course";

interface ModuleItemProps {
  item: ModuleItem;
  currentItemId: string | null;
  completedItems: Set<string>;
  onSelectItem: (itemId: string) => void;
}

export default function ModuleItemComponent({
  item,
  currentItemId,
  completedItems,
  onSelectItem,
}: ModuleItemProps) {
  const location = useLocation();

  // Handle lessons (CourseLesson is an array)
  if (item.CourseLesson && Array.isArray(item.CourseLesson) && item.CourseLesson.length > 0) {
    const lesson = item.CourseLesson[0];
    const itemId = `lesson-${lesson.Id}`;
    const isCompleted = completedItems.has(itemId);
    const isCurrent = currentItemId === itemId;
    const path = `/lesson/${lesson.Id}`;
    const active = location.pathname === path || isCurrent;

    return (
      <li key={itemId}>
        <button
          onClick={() => onSelectItem(itemId)}
          className={`w-full text-left text-sm flex items-center gap-2 py-1 ${
            active ? "text-green-600 font-medium" : "text-gray-700 hover:text-green-500"
          }`}
        >
          {/* Status indicator */}
          {isCompleted ? (
            <span className="text-green-600">✓</span>
          ) : isCurrent ? (
            <span className="text-blue-600">→</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          📘 {lesson.Title}
        </button>
      </li>
    );
  }

  // Handle exams (Exam is also an array)
  if (item.Exam && Array.isArray(item.Exam) && item.Exam.length > 0) {
    const exam = item.Exam[0];
    const itemId = `exam-${exam.Id}`;
    const isCompleted = completedItems.has(itemId);
    const isCurrent = currentItemId === itemId;
    const path = `/exam/${exam.Id}`;
    const active = location.pathname === path || isCurrent;

    return (
      <li key={itemId}>
        <button
          onClick={() => onSelectItem(itemId)}
          className={`w-full text-left text-sm flex items-center gap-2 py-1 ${
            active ? "text-green-600 font-medium" : "text-gray-700 hover:text-green-500"
          }`}
        >
          {/* Status indicator */}
          {isCompleted ? (
            <span className="text-green-600">✓</span>
          ) : isCurrent ? (
            <span className="text-blue-600">→</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          📝 {exam.Title}
        </button>
      </li>
    );
  }

  return null;
}