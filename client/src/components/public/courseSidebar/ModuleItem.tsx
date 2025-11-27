import { Link, useLocation } from "react-router-dom";
import type { ModuleItem } from "../../../types/course";

interface ModuleItemProps {
    item: ModuleItem;
}

export default function ModuleItemComponent({ item }: ModuleItemProps) {
    const location = useLocation();

    if (item.CourseLesson) {
        const path = `/lesson/${item.CourseLesson.Id}`;
        const active = location.pathname === path;
        return (
            <li key={`lesson-${item.CourseLesson.Id}`}>
                <Link
                    to={path}
                    className={`block text-sm ${active ? "text-green-600 font-medium" : "text-gray-700 hover:text-green-500"
                        }`}
                >
                    📘 {item.CourseLesson.Title}
                </Link>
            </li>
        );
    }

    if (item.Exam) {
        const path = `/exam/${item.Exam.Id}`;
        const active = location.pathname === path;
        return (
            <li key={`exam-${item.Exam.Id}`}>
                <Link
                    to={path}
                    className={`block text-sm ${active ? "text-green-600 font-medium" : "text-gray-700 hover:text-green-500"
                        }`}
                >
                    📝 {item.Exam.Title}
                </Link>
            </li>
        );
    }

    return null;
}
