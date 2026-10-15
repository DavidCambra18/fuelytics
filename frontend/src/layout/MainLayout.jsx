import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Analytics } from "@vercel/analytics/next"

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <Analytics />
        <Outlet />
      </main>
    </div>
  );
}