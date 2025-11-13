import React, { useEffect, useState } from "react";
import { getAll } from "../../api/course";
import type { Course } from "../../types";
import CourseList from "./CourseList";
import CourseForm from "./CourseForm";

const CoursePage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editing, setEditing] = useState<Course | null>(null);

  const loadCourses = async () => {
    const data = await getAll();
    setCourses(data);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSaved = (course: Course) => {
    setCourses(prev => {
      const idx = prev.findIndex(c => c.Id === course.Id);
      if (idx >= 0) {
        prev[idx] = course;
      } else {
        prev.push(course);
      }
      return [...prev];
    });
    setEditing(null);
  };

  const handleDeleted = (id: number) => {
    setCourses(prev => prev.filter(c => c.Id !== id));
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Manage Courses</h1>
      <CourseForm course={editing ?? undefined} onSaved={handleSaved}/>
      <CourseList courses={courses} onEdit={setEditing} onDeleted={handleDeleted}/>
    </div>
  );
};

export default CoursePage;
