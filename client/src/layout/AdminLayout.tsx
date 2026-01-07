import { Outlet } from "react-router-dom"
import SideNav from "../components/adminDashboard/SideNav"

export default function AdminLayout() {
  return (
    <div className="flex h-screen">
      <SideNav />
      <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
