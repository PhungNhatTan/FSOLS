import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CourseSidebar from "../../components/public/courseSidebar/CourseSidebar";
import LessonViewer from "../../components/public/lesson/LessonViewer"; // NEW wrapper component
import ExamViewer from "../../components/public/exam/ExamViewer";
import ExamDetailViewer from "../../components/public/exam/ExamDetailViewer";
import http from "../../service/http";
import type { CourseNavData, CourseModule, FlattenedItem } from "../../types/course";

export default function CourseStudyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [courseData, setCourseData] = useState<CourseNavData | null>(null);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [takingExam, setTakingExam] = useState(false); // NEW: Track exam mode

  // Load course data
  useEffect(() => {
    if (!id) {
      setError("Course not found");
      setLoading(false);
      return;
    }

    // Load course data and progress in parallel
    Promise.all([
      http.get<CourseNavData>(`/course/${id}`),
      http.get<{ enrollmentId: number; completedLessons: number[]; completedExams: number[] }>(`/progress/courses/${id}`)
    ])
      .then(([courseRes, progressRes]) => {
        setCourseData(courseRes.data);
        
        const { enrollmentId: eId, completedLessons, completedExams } = progressRes.data;
        setEnrollmentId(eId);

        // Convert backend IDs to frontend Set format
        const completed = new Set<string>();
        completedLessons.forEach(lid => completed.add(`lesson-${lid}`));
        completedExams.forEach(eid => completed.add(`exam-${eid}`));
        setCompletedItems(completed);
        
        // Set first item as current if nothing is saved in local storage for this session
        // We still use localStorage for the current item ID as a convenience
        const savedProgress = localStorage.getItem(`course_${id}_last_item`);
        const firstItem = flattenCourseItems(courseRes.data.CourseModule)[0];
        
        if (savedProgress) {
          setCurrentItemId(savedProgress);
        } else if (firstItem) {
          setCurrentItemId(firstItem.id);
        }
        
        setError("");
      })
      .catch((err) => {
        console.error("Failed to load course or progress:", err);
        setError("Failed to load course details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Flatten course structure
  const flattenedItems = courseData 
    ? flattenCourseItems(courseData.CourseModule)
    : [];

  const currentItem = flattenedItems.find(item => item.id === currentItemId);
  const currentIndex = flattenedItems.findIndex(item => item.id === currentItemId);

  // Save current item to localStorage for convenience
  useEffect(() => {
    if (id && currentItemId) {
      localStorage.setItem(`course_${id}_last_item`, currentItemId);
    }
  }, [id, currentItemId]);

  // Mark current item as completed and move to next
  const handleComplete = useCallback(async () => {
    if (!currentItemId || !currentItem || !id) return;
    
    try {
      if (currentItem.type === "Lesson" && enrollmentId) {
        await http.post(`/progress/lessons/${currentItem.lessonId}/complete`, {
          enrollmentId
        });
      }
      // For Exams, the submission already tracks progress on the backend
      // But we update the local state to reflect it immediately
      
      setCompletedItems(prev => new Set(prev).add(currentItemId));
      
      // Move to next item
      if (currentIndex < flattenedItems.length - 1) {
        setCurrentItemId(flattenedItems[currentIndex + 1].id);
        setTakingExam(false);
      }
    } catch (err) {
      console.error("Failed to mark complete:", err);
    }
  }, [currentItemId, currentItem, id, enrollmentId, currentIndex, flattenedItems]);

  // NEW: Start taking exam
  const handleStartExam = useCallback(() => {
    setTakingExam(true);
  }, []);

  // NEW: Return from taking exam to detail view
  const handleExamComplete = useCallback(() => {
    setTakingExam(false);
  }, []);

  // Navigation handlers
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentItemId(flattenedItems[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < flattenedItems.length - 1) {
      setCurrentItemId(flattenedItems[currentIndex + 1].id);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setCurrentItemId(itemId);
    setTakingExam(false); // Reset exam mode when switching items
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate("/courses")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!courseData || flattenedItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No course content available</p>
      </div>
    );
  }

  const progress = (completedItems.size / flattenedItems.length) * 100;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <CourseSidebar
        courseData={courseData}
        currentItemId={currentItemId}
        completedItems={completedItems}
        progress={progress}
        onSelectItem={handleSelectItem}
        onBack={() => navigate("/courses")}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-white">
          {currentItem?.type === "Lesson" ? (
            <LessonViewer
              lessonId={currentItem.lessonId!}
              onComplete={handleComplete}
            />
          ) : currentItem?.type === "Exam" ? (
            // Show ExamDetailViewer or ExamViewer based on takingExam state
            takingExam ? (
              <ExamViewer
                examId={currentItem.examId!}
                onComplete={handleExamComplete}
              />
            ) : (
              <ExamDetailViewer
                examId={currentItem.examId!}
                onStartExam={handleStartExam}
                onComplete={handleComplete}
              />
            )
          ) : (
            <div className="p-6 text-gray-500">No content selected</div>
          )}
        </div>

        {/* Navigation footer */}
        <div className="border-t bg-white p-4 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition"
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-600">
            {currentIndex + 1} of {flattenedItems.length}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === flattenedItems.length - 1}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
          >
            {currentIndex === flattenedItems.length - 1 ? "Complete Course" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Flatten course structure into linear array
function flattenCourseItems(modules: CourseModule[]): FlattenedItem[] {
  const items: FlattenedItem[] = [];

  const sortedModules = [...modules].sort((a, b) => (a.OrderNo || 0) - (b.OrderNo || 0));

  for (const module of sortedModules) {
    const sortedItems = [...(module.ModuleItems || [])].sort(
      (a, b) => (a.OrderNo || 0) - (b.OrderNo || 0)
    );

    for (const moduleItem of sortedItems) {
      // Add lessons (CourseLesson is an array or null)
      const lessons = moduleItem.CourseLesson || [];
      for (const lesson of lessons) {
        items.push({
          id: `lesson-${lesson.Id}`,
          type: "Lesson",
          title: lesson.Title,
          moduleId: module.Id,
          moduleTitle: `Module ${module.OrderNo || module.Id}`,
          lessonId: String(lesson.Id), // Convert to string
        });
      }

      // Add exams (Exam is an array or null)
      const exams = moduleItem.Exam || [];
      for (const exam of exams) {
        items.push({
          id: `exam-${exam.Id}`,
          type: "Exam",
          title: exam.Title,
          moduleId: module.Id,
          moduleTitle: `Module ${module.OrderNo || module.Id}`,
          examId: exam.Id,
        });
      }
    }
  }

  return items;
}