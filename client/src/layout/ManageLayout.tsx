// src/components/layouts/ManageLayout.tsx
import { Outlet } from "react-router-dom";
import SideNav from "../components/mentorDashboard/SideNav";

export default function ManageLayout() {
  return (
    <div className="flex h-screen">
      <SideNav />
      <main className="flex-1 p-6 bg-gray-100">
        <Outlet /> {/* Nested route content will render here */}
      </main>
    </div>
  );
}
