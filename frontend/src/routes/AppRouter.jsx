import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import PageTransition from "../components/PageTransition";

import VehicleLayout from "../layout/VehicleLayout";
import ProtectedLayout from "../layout/ProtectedLayout";
import OptionalAppLayout from "../layout/OptionalAppLayout";
import { isTokenValid, useAuth } from "../context/auth";

const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const VehicleCreate = lazy(() => import("../pages/VehicleCreate"));
const VehicleEdit = lazy(() => import("../pages/VehicleEdit"));
const VehicleOverview = lazy(() => import("../pages/VehicleOverview"));
const Fuelings = lazy(() => import("../pages/Fuelings"));
const Expenses = lazy(() => import("../pages/Expenses"));
const Statistics = lazy(() => import("../pages/Statistics"));
const Settings = lazy(() => import("../pages/Settings"));
const Friends = lazy(() => import("../pages/Friends"));
const MyProfile = lazy(() => import("../pages/MyProfile"));
const PublicProfile = lazy(() => import("../pages/PublicProfile"));
const PublicVehicle = lazy(() => import("../pages/PublicVehicle"));
const Ranking = lazy(() => import("../pages/Ranking"));
const TireModule = lazy(() => import("../components/TireModule"));
const TripCalculator = lazy(() => import("../components/TripCalculator"));
const GasStations = lazy(() => import("../pages/GasStations"));

function RouteFallback() {
  return (
    <div className="section-shell flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
      Cargando contenido...
    </div>
  );
}

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
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location}>

        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route element={<OptionalAppLayout />}>
        <Route
          path="/gas-stations"
          element={
            <PageTransition>
              <GasStations />
            </PageTransition>
          }
        />
        <Route path="/users/:username" element={<PageTransition><PublicProfile /></PageTransition>} />
        <Route path="/public/vehicles/:id" element={<PageTransition><PublicVehicle /></PageTransition>} />
        </Route>
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

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/ranking" element={<PageTransition><Ranking /></PageTransition>} />
          <Route path="/friends" element={<PageTransition><Friends /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
          <Route path="/calculator" element={<TripCalculator />} />
          <Route path="/my-profile" element={<PageTransition><MyProfile /></PageTransition>} />
          <Route path="/vehicles/new" element={<PageTransition><VehicleCreate /></PageTransition>} />
          <Route path="/vehicles/:vehicleId" element={<VehicleLayout />}>
            <Route index element={<PageTransition><VehicleOverview /></PageTransition>} />
            <Route path="edit" element={<PageTransition><VehicleEdit /></PageTransition>} />
            <Route path="fuelings" element={<PageTransition><Fuelings /></PageTransition>} />
            <Route path="expenses" element={<PageTransition><Expenses /></PageTransition>} />
            <Route path="tires" element={<TireModule />} />
            <Route path="statistics" element={<PageTransition><Statistics /></PageTransition>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
