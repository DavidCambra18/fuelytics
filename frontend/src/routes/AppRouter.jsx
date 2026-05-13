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
import ProtectedLayout from "../layout/ProtectedLayout";

function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        {/* Private */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles/new" element={<VehicleCreate />} />
          <Route path="/vehicles/:vehicleId" element={<VehicleLayout />}>
            <Route index element={<VehicleOverview />} />
            <Route path="edit" element={<VehicleEdit />} />
            <Route path="fuelings" element={<Fuelings />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="statistics" element={<Statistics />} />
          </Route>
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}