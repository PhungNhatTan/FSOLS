import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import courseApi from "../../../api/course";
import type { Course } from "../../../types";
import CourseList from "./CourseList";
import CourseForm from "./CourseForm";

const CoursePage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editing, setEditing] = useState<Course | null>(null);
  const navigate = useNavigate();

  const loadCourses = async () => {
    const data = await courseApi.getByCreator();
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

  const handleManage = (courseId: number) => {
    navigate(`/manage/course/${courseId}`);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Manage Courses</h1>
      <CourseForm course={editing ?? undefined} onSaved={handleSaved}/>
      <CourseList 
        courses={courses} 
        onEdit={setEditing} 
        onDeleted={handleDeleted}
        onManage={handleManage}
      />
    </div>
  );
};

export default CoursePage;