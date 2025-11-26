import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex justify-between items-center shadow">
      <Link to="/" className="text-lg font-bold hover:text-green-400">
        FSOLS
      </Link>

      <div className="flex gap-5 items-center">
        <Link to="/courses" className="hover:text-green-400">
          Courses
        </Link>

        {user ? (
          <>
            {(user.role === "Mentor" || user.role === "Admin") && (
              <Link to="/lesson/upload" className="hover:text-green-400">
                Upload Lesson
              </Link>
            )}
            <span className="text-gray-300 text-sm">
              Hello, <b>{user.username}</b> ({user.role ?? "User"})
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-green-400">
              Login
            </Link>
            <Link to="/register" className="hover:text-green-400">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
