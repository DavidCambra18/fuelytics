import { Navigate, Outlet } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { isTokenValid, useAuth } from "../context/AuthContext";

export default function ProtectedLayout() {
  const { token } = useAuth();

  if (!isTokenValid(token)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <UserMenu />
      <Outlet />
    </>
  );
}