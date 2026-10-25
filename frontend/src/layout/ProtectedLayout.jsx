import { sessionIdentity } from "../utils/authStorage";
import { Navigate } from "react-router-dom";
import AppShell from "./AppShell";
import { isTokenValid, useAuth } from "../context/auth";

export default function ProtectedLayout() {
  const { token } = useAuth();

  if (!isTokenValid(token)) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell key={sessionIdentity(token)} />;
}
