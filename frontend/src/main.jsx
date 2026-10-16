import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
      <Analytics />
    </AuthProvider>
  </React.StrictMode>
);