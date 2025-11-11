import React, { useState } from "react";
import { create, update } from "../../api/course";
import type { Course } from "../../types";

interface Props {
    course?: Course;
    onSaved?: (course: Course) => void;
}

const CourseForm: React.FC<Props> = ({ course, onSaved }) => {
    const [name, setName] = useState(course?.Title || "");
    const [description, setDescription] = useState(course?.Description || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let savedCourse: Course;
            if (course) {
                savedCourse = await update(course.Id, { Title: name, Description: description });
            } else {
                savedCourse = await create({ Title: name, Description: description });
            }
            onSaved?.(savedCourse);
        } catch (err) {
            console.error(err);
            alert("Failed to save course");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded space-y-2">
            <div>
                <label>Name:</label>
                <input value={name} onChange={e => setName(e.target.value)} required className="border p-1 w-full" />
            </div>
            <div>
                <label>Description:</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required className="border p-1 w-full" />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
                {course ? "Update" : "Create"} Course
            </button>
        </form>
    );
};

export default CourseForm;
