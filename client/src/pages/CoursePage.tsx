import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import courseApi, { type Course } from "../api/course";

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    courseApi
      .getAll()
      .then((data) => {
        setCourses(data);
        setError("");
      })
      .catch((err) => setError(`Failed to load courses: ${err.message}`))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) {
      return courses;
    }

    const query = searchQuery.toLowerCase().trim();
    return courses.filter((course) => {
      const name = (course.Name || course.Title || "").toLowerCase();
      const description = (course.Description || "").toLowerCase();
      const instructor = (course.Instructor || "").toLowerCase();
      
      return (
        name.includes(query) ||
        description.includes(query) ||
        instructor.includes(query)
      );
    });
  }, [courses, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Available Courses</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search courses by name, description, or instructor..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Search Results Count */}
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            Found {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
            {filteredCourses.length !== courses.length && ` out of ${courses.length}`}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery ? (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or{" "}
                <button
                  onClick={clearSearch}
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  clear the search
                </button>
              </p>
            </>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No courses available</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no courses in the system yet.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <div
              key={course.Id}
              className="border rounded-xl p-4 shadow hover:shadow-lg transition-all duration-200 bg-white"
            >
              <h2 className="text-lg font-semibold mb-2 text-gray-900">
                {course.Name || course.Title || "Untitled Course"}
              </h2>
              {course.Instructor && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Instructor:</span> {course.Instructor}
                </p>
              )}
              {course.LessonCount !== undefined && (
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Lessons:</span> {course.LessonCount}
                </p>
              )}
              <p className="text-gray-800 mb-4 line-clamp-3">
                {course.Description || "No description available."}
              </p>
              <Link
                to={`/course/${course.Id}`}
                className="inline-block text-blue-600 hover:text-blue-700 font-medium hover:underline transition"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
