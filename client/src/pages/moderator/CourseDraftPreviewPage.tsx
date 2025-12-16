import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import type { CourseModule, RawModuleItem } from "../../types/course"
import { courseManagementApi } from "../../api/courseManagement";
import type {
  UiModuleLocal as Module,
} from "../../types/manage";
import type { Course, DraftJson } from "../../types/course";
import {
  mapModuleDtoToLocal,
  mapDraftToLocal,
} from "../../service/CourseManagementService";

export default function CourseDraftPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const [error] = useState("")
  const [loading] = useState(true)
  const courseId = Number(id ?? 0);

  const [course, setCourse] = useState<Course | null>(null);
  const [, setModules] = useState<Module[]>([]);
  const [, setSkills] = useState<{ id: number; skillName: string }[]>([]);
  const [, setLastSaved] = useState<string>("Never");

  // Load initial data
  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (!id) return
    loadCourse()
  }, [id])

  const loadCourse = async () => {
    if (courseId <= 0) return;

    try {
      // Always load base course metadata
      const structure = await courseManagementApi.getStructure(courseId);
      setCourse(structure.course);

      let draftLoaded = false;

      try {
        const draftResponse = await courseManagementApi.getDraft(courseId);

        if (draftResponse?.draft) {
          const draft: DraftJson =
            typeof draftResponse.draft === "string"
              ? JSON.parse(draftResponse.draft)
              : draftResponse.draft;

          if (Array.isArray(draft.modules)) {
            const { modules, skills } = mapDraftToLocal(draft);
            setModules(modules);
            setSkills(skills);
            setLastSaved(
              `Draft loaded (${new Date(draft.lastModified).toLocaleString()})`
            );
            draftLoaded = true;
          }
        }
      } catch {
        // no draft, fall back
      }

      if (!draftLoaded) {
        const mappedModules = structure.modules
          ? structure.modules.map(mapModuleDtoToLocal)
          : [];
        setModules(mappedModules);
        setSkills([]);
        setLastSaved("No draft");
      }
    } catch (err) {
      console.error("Error loading course:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading course draft...</p>
        </div>
      </div>
    )
  }

  if (!course && !loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Course draft not found or failed to load.
        </div>
        <div className="mt-4">
          <Link to="/moderator/courses" className="text-blue-600 hover:underline">
            ← Back to requests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/moderator/courses" className="text-gray-500 hover:text-gray-900">
              ← Back
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <span className="font-semibold text-gray-900">Draft Preview Mode</span>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              Read Only
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {course && (
          <div className="space-y-6">
            {/* Course Header */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.Name}</h1>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                {course.Description || "No description provided."}
              </p>
            </div>

            {/* Course Content */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Course Content</h2>

              {"CourseModule" in course &&
                Array.isArray((course as { CourseModule?: CourseModule[] }).CourseModule) &&
                ((course as { CourseModule?: CourseModule[] }).CourseModule?.length ?? 0) > 0 ? (
                <div className="space-y-4">
                  {(course as { CourseModule?: CourseModule[] }).CourseModule?.map((module: CourseModule) => (
                    <div key={module.Id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-800">
                          Module {module.OrderNo}: {module.ModuleItems?.[0]?.CourseLesson?.Title ? "" : ""}
                          {/* The module title isn't directly in CourseModule type based on previous read, 
                              but let's check the type definition again. 
                              Wait, CourseModule in types/course.ts has Id, OrderNo, ModuleItems. 
                              It doesn't seem to have a Title field in the interface I read earlier?
                              Let's check types/course.ts again.
                          */}
                          Module {module.OrderNo}
                        </h3>
                      </div>
                      <div className="p-4">
                        {module.ModuleItems && module.ModuleItems.length > 0 ? (
                          <ul className="space-y-3">
                            {module.ModuleItems.map((item: RawModuleItem) => (
                              <li key={item.Id} className="flex items-center gap-3 text-gray-700">
                                {item.CourseLesson && (
                                  <>
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm">
                                      📹
                                    </span>
                                    <span className="font-medium">{item.CourseLesson.Title}</span>
                                  </>
                                )}
                                {item.Exam && (
                                  <>
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full text-sm">
                                      📝
                                    </span>
                                    <span className="font-medium">{item.Exam.Title}</span>
                                    <span className="text-xs text-gray-500 ml-2">

                                    </span>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic text-sm">No items in this module</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No modules found in this draft.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
