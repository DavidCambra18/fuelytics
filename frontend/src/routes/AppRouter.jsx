import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import VehicleCreate from "../pages/VehicleCreate";
import VehicleEdit from "../pages/VehicleEdit";
import Fuelings from "../pages/Fuelings";
import Expenses from "../pages/Expenses";
import Statistics from "../pages/Statistics";
import VehicleLayout from "../layout/VehicleLayout";
import VehicleOverview from "../pages/VehicleOverview";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicles/new"
          element={
            <ProtectedRoute>
              <VehicleCreate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicles/:vehicleId"
          element={
            <ProtectedRoute>
              <VehicleLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<VehicleOverview />} />
          <Route path="edit" element={<VehicleEdit />} />
          <Route path="fuelings" element={<Fuelings />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="statistics" element={<Statistics />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}