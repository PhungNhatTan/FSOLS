import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getToken, logout } from "../api/auth";

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoggedIn(!!getToken());
    }, []);

    const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
        navigate("/login");
    };

    return (
        <nav className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center shadow-md">
            {/* Logo / Brand */}
            <Link to="/" className="text-xl font-bold hover:text-green-400 transition-colors">
                FSOLS
            </Link>

            {/* Links */}
            <div className="flex items-center space-x-6">
                <Link
                    to="/courses"
                    className="hover:text-green-400 transition-colors"
                >
                    Courses
                </Link>

                {isLoggedIn ? (
                    <>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            className="hover:text-green-400 transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="hover:text-green-400 transition-colors"
                        >
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
