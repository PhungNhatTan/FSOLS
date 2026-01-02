import { Link, useLocation } from "react-router-dom";
import type { ModuleItem } from "../../../types/course";

interface ModuleItemProps {
    item: ModuleItem;
}

export default function ModuleItemComponent({ item }: ModuleItemProps) {
    const location = useLocation();
    
    // CourseLesson is an array, so get the first element
    if (item.CourseLesson && Array.isArray(item.CourseLesson) && item.CourseLesson.length > 0) {
        const lesson = item.CourseLesson[0];
        const path = `/lesson/${lesson.Id}`;
        const active = location.pathname === path;
        return (
            <li key={`lesson-${lesson.Id}`}>
                <Link
                    to={path}
                    className={`block text-sm ${
                        active ? "text-green-600 font-medium" : "text-gray-700 hover:text-green-500"
                    }`}
                >
                    📘 {lesson.Title}
                </Link>
            </li>
        );
    }
    
    // Exam is also an array, so get the first element
    if (item.Exam && Array.isArray(item.Exam) && item.Exam.length > 0) {
        const exam = item.Exam[0];
        const path = `/exam/${exam.Id}`;
        const active = location.pathname === path;
        return (
            <li key={`exam-${exam.Id}`}>
                <Link
                    to={path}
                    className={`block text-sm ${
                        active ? "text-green-600 font-medium" : "text-gray-700 hover:text-green-500"
                    }`}
                >
                    📝 {exam.Title}
                </Link>
            </li>
        );
    }
    
    return null;
}