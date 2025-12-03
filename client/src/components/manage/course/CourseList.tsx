import React from "react";
import { useNavigate } from "react-router-dom";
import courseApi from "../../../api/course";
import type { Course } from "../../../types";

interface Props {
  courses: Course[];
  onEdit?: (course: Course) => void;
  onDeleted?: (id: number) => void;
}

const CourseList: React.FC<Props> = ({ courses, onEdit, onDeleted }) => {
  const navigate = useNavigate();
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await courseApi.remove(id);
      onDeleted?.(id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  };

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th className="border px-2">ID</th>
          <th className="border px-2">Name</th>
          <th className="border px-2">Description</th>
          <th className="border px-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {[...courses].sort((a, b) => {
          if (a.DeletedAt && !b.DeletedAt) return 1;
          if (!a.DeletedAt && b.DeletedAt) return -1;
          return 0;
        }).map(c => (
          <tr key={c.Id}>
            <td className="border px-2">{c.Id}</td>
            <td className="border px-2">{c.Name}</td>
            <td className="border px-2">{c.Description}</td>
            <td className="border px-2">
              <div className="flex justify-between items-center">
                {!c.DeletedAt && (
                  <div className="space-x-2">
                    <button onClick={() => onEdit?.(c)} className="bg-yellow-500 text-white px-2 rounded">Edit</button>
                    <button onClick={() => navigate(`/manage/course/${c.Id}`)} className="bg-indigo-500 text-white px-2 rounded">Manage</button>
                    <button onClick={() => handleDelete(c.Id)} className="bg-red-500 text-white px-2 rounded">Delete</button>
                  </div>
                )}
                {c.DeletedAt && (
                  <span className="text-red-500 ml-auto">Deleted</span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CourseList;
