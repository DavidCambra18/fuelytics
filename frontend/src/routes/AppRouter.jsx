import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import VehicleCreate from "../pages/VehicleCreate";
import VehicleEdit from "../pages/VehicleEdit";
import Fuelings from "../pages/Fuelings";
import Expenses from "../pages/Expenses";
import Statistics from "../pages/Statistics";
import Settings from "../pages/Settings";
import UserProfile from "../pages/UserProfile";
import GasStations from "../pages/GasStations";
import VehicleLayout from "../layout/VehicleLayout";
import VehicleOverview from "../pages/VehicleOverview";
import ProtectedLayout from "../layout/ProtectedLayout";
import { isTokenValid, useAuth } from "../context/AuthContext";

function PublicOnlyRoute({ children }) {
  const { token } = useAuth();

  if (isTokenValid(token)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <InnerRoutes />
    </BrowserRouter>
  );
}

function InnerRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>

        {/* Public */}
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route 
        path="/gas-stations"
        element={
        <PageTransition>
          <GasStations />
          </PageTransition>
        } 
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <PageTransition><Login /></PageTransition>
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <PageTransition><Register /></PageTransition>
            </PublicOnlyRoute>
          }
        />

        <Route path="/users/:username" element={<PageTransition><UserProfile /></PageTransition>} />

        {/* Private */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
          <Route path="/vehicles/new" element={<PageTransition><VehicleCreate /></PageTransition>} />
          <Route path="/vehicles/:vehicleId" element={<VehicleLayout />}>
            <Route index element={<PageTransition><VehicleOverview /></PageTransition>} />
            <Route path="edit" element={<PageTransition><VehicleEdit /></PageTransition>} />
            <Route path="fuelings" element={<PageTransition><Fuelings /></PageTransition>} />
            <Route path="expenses" element={<PageTransition><Expenses /></PageTransition>} />
            <Route path="statistics" element={<PageTransition><Statistics /></PageTransition>} />
          </Route>
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </AnimatePresence>
  );
}