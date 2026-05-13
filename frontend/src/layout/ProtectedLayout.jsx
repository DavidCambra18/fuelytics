import { Navigate, Outlet } from "react-router-dom";
import UserMenu from "../components/UserMenu";

export default function ProtectedLayout() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <UserMenu />
      <Outlet />
    </>
  );
}