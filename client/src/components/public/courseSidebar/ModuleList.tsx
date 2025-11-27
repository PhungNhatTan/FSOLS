import ModuleItemComponent from "./ModuleItem";
import type { CourseModule } from "../../../types/course";

interface ModuleListProps {
    modules: CourseModule[];
    expanded: number | null;
    onToggle: (id: number) => void;
}

export default function ModuleList({ modules, expanded, onToggle }: ModuleListProps) {
    return (
        <>
            {modules.map((module) => (
                <div key={module.Id} className="mb-3">
                    <button
                        onClick={() => onToggle(module.Id)}
                        className="w-full text-left font-semibold text-gray-800 hover:text-green-600 mb-1"
                    >
                        Module {module.OrderNo}
                    </button>

                    {expanded === module.Id && (
                        <ul className="ml-3 border-l border-gray-300 pl-2 space-y-1">
                            {module.ModuleItems.map((item) => (
                                <ModuleItemComponent key={item.Id} item={item} />
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </>
    );
}
