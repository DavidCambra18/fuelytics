import { Outlet } from "react-router-dom";
import { isTokenValid, useAuth } from "../context/auth";
import AppShell from "./AppShell";

export default function OptionalAppLayout() {
  const { token } = useAuth();
  return isTokenValid(token) ? <AppShell /> : <Outlet />;
}
