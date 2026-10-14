import { Navigate, Outlet } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { isTokenValid, useAuth } from "../context/auth";

export default function ProtectedLayout() {
  const { token } = useAuth();

  if (!isTokenValid(token)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <UserMenu />
      <div className="pb-20 sm:pb-0">
        <Outlet />
      </div>
    </>
  );
}
