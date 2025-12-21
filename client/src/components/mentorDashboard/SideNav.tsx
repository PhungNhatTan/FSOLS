import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

interface SidebarItem {
    name: string;
    path: string;
}

const sidebarItems: SidebarItem[] = [
  { name: "Overview", path: "/manage/dashboard" },
  { name: "Courses", path: "/manage/courses" },
  { name: "Certificates", path: "/manage/certificates" }, 
  { name: "Settings", path: "#" },
];

export default function SideNav() {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`bg-gray-800 text-white h-screen p-4 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"
                }`}
        >
            {/* Collapse button */}
            <button
                className="mb-6 self-end p-1 hover:bg-gray-700 rounded"
                onClick={() => setCollapsed(!collapsed)}
            >
                {collapsed ? "→" : "←"}
            </button>

            {/* Menu items */}
            <nav className="flex flex-col gap-2">
                {sidebarItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`px-3 py-2 rounded hover:bg-gray-700 ${active ? "bg-green-600 font-semibold" : ""
                                }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
