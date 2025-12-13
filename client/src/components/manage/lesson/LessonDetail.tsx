import { Btn } from "../ui/Btn";
import { Card } from "../ui/Card";
import type { UiLessonLocal as Lesson } from "../../../types/manage";

export function LessonDetail({
    lesson,
    onClear,
}: {
    lesson: Lesson;
    onClear: () => void;
}) {

    return (
        <Card
            title={`📖 ${lesson.title}`}
            action={<Btn size="sm" onClick={onClear}>Clear</Btn>}
        >
            <div className="space-y-3">
                {lesson.description && (
                    <div>
                        <div className="text-sm font-semibold text-slate-700">Description</div>
                        <div className="text-sm text-slate-600 mt-1">{lesson.description}</div>
                    </div>
                )}
                {lesson.resources.length > 0 && (
                    <div>
                        <div className="text-sm font-semibold text-slate-700">Resources</div>
                        <ul className="mt-2 space-y-2">
                            {lesson.resources.map((r) => (
                                <li key={r.id} className="rounded-xl border p-2">
                                    <a className="text-indigo-600 hover:underline text-sm" href={r.url} target="_blank" rel="noreferrer">
                                        {r.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="text-xs text-slate-500">Order: {lesson.order}</div>
            </div>
        </Card>
    );
}
