import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import { 
  ArrowLeft, 
  ChevronDown, 
  Search, 
  ChevronRight, 
  User, 
  Shield, 
  Save, 
  Eye, 
  Car, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Check,
  X
} from "lucide-react";

function createToast(message, tone = "success") {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message,
    tone,
  };
}

function Toggle({ checked, disabled, onChange, label, hint }) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition ${disabled ? "opacity-60" : "hover:border-teal-300/20"}`}>
      <span className="space-y-1">
        <span className="block text-sm font-medium text-white">{label}</span>
        {hint ? <span className="block text-xs leading-5 text-slate-400">{hint}</span> : null}
      </span>
      <span
        className={`relative mt-0.5 inline-flex h-7 w-12 items-center rounded-full border p-1 transition ${checked ? "border-teal-300/30 bg-teal-400/20" : "border-white/10 bg-slate-900/80"}`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className={`block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5 bg-teal-200" : "translate-x-0"}`}
        />
      </span>
    </label>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { token, username, setAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef([]);
  const [profileForm, setProfileForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
  });
  
  const [usernameError, setUsernameError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle");

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [expandedVehicleId, setExpandedVehicleId] = useState(null);
  const [accountPrivacy, setAccountPrivacy] = useState(true);
  const [vehicles, setVehicles] = useState([]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/dashboard");
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError("");

      try {
        const [profileResponse, vehiclesResponse] = await Promise.all([
          apiFetch("/api/users/profile"),
          apiFetch("/api/vehicles"),
        ]);

        if (!profileResponse.ok) {
          const profileError = await profileResponse.json().catch(() => ({}));
          throw new Error(profileError.message || "No se pudo cargar la configuración de la cuenta");
        }

        if (!vehiclesResponse.ok) {
          const vehiclesError = await vehiclesResponse.json().catch(() => ({}));
          throw new Error(vehiclesError.message || "No se pudieron cargar los vehículos");
        }

        const profileData = await profileResponse.json();
        const vehiclesData = await vehiclesResponse.json();

        setProfileForm({
          username: profileData.username || username || "",
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
        });
        setAccountPrivacy(profileData.profilePublic !== false);
        setVehicles(
          (vehiclesData || []).map((vehicle) => ({
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            isPublic: Boolean(vehicle.isPublic),
            showFuelData: Boolean(vehicle.showFuelData),
            showExpenses: Boolean(vehicle.showExpenses),
            showStatistics: Boolean(vehicle.showStatistics),
          }))
        );
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar la configuración");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    return () => {
      toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      toastTimersRef.current = [];
    };
  }, [username]);

  useEffect(() => {
    const val = profileForm.username.trim();
    if (!val || loading) return;

    if (val === username) {
      setUsernameStatus("success");
      setUsernameError("");
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await apiFetch(`/api/users/check-username?username=${encodeURIComponent(val)}`);
        if (!res.ok) {
          setUsernameError("El nombre de usuario ya está en uso");
          setUsernameStatus("error");
        } else {
          setUsernameError("");
          setUsernameStatus("success");
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [profileForm.username, username, loading]);

  const tabs = useMemo(
    () => [
      { id: "profile", label: "Perfil", icon: User },
      { id: "privacy", label: "Privacidad", icon: Shield },
    ],
    []
  );

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = vehicleSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return vehicles;
    }

    return vehicles.filter((vehicle) => {
      const haystack = [vehicle.brand, vehicle.model, vehicle.year]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [vehicles, vehicleSearch]);

  const pushToast = (message, tone = "success") => {
    const toast = createToast(message, tone);
    setToasts((current) => [...current, toast]);

    const timerId = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 3200);

    toastTimersRef.current.push(timerId);
  };

  const handleProfileChange = (field) => (event) => {
    setProfileForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    
    if (usernameError || usernameStatus === "checking") {
      return;
    }
    
    setSavingProfile(true);
    setError("");

    try {
      const response = await apiFetch("/api/users/profile", {
        method: "PUT",
        body: {
          username: profileForm.username.trim(),
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 409) {
          throw new Error("El nombre de usuario ya está en uso. Por favor, elige otro.");
        }
        
        throw new Error(errorData.message || errorData.error || "No se pudo guardar el perfil");
      }

      const savedProfile = await response.json();

      setProfileForm({
        username: savedProfile.username || "",
        firstName: savedProfile.firstName || "",
        lastName: savedProfile.lastName || "",
      });
      setAuth({ token: token || "", username: savedProfile.username || "" });
      pushToast("Perfil actualizado correctamente");
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el perfil");
      pushToast(saveError.message || "No se pudo guardar el perfil", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVehicleChange = (vehicleId, field, checked) => {
    setVehicles((current) =>
      current.map((vehicle) => {
        if (vehicle.id !== vehicleId) {
          return vehicle;
        }

        if (field === "isPublic" && !checked) {
          return {
            ...vehicle,
            isPublic: false,
            showFuelData: false,
            showExpenses: false,
            showStatistics: false,
          };
        }

        if (!vehicle.isPublic && field !== "isPublic") {
          return vehicle;
        }

        return {
          ...vehicle,
          [field]: checked,
        };
      })
    );
  };

  const toggleVehiclePanel = (vehicleId) => {
    setExpandedVehicleId((current) => (current === vehicleId ? null : vehicleId));
  };

  const savePrivacy = async () => {
    setSavingPrivacy(true);
    setError("");

    try {
      const accountResponse = await apiFetch("/api/users/privacy", {
        method: "PUT",
        body: { profilePublic: accountPrivacy },
      });

      if (!accountResponse.ok) {
        const errorData = await accountResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo guardar la privacidad de la cuenta");
      }

      const vehicleUpdates = vehicles.map((vehicle) => {
        const isPublic = Boolean(vehicle.isPublic);
        const payload = {
          isPublic,
          showFuelData: isPublic ? Boolean(vehicle.showFuelData) : false,
          showExpenses: isPublic ? Boolean(vehicle.showExpenses) : false,
          showStatistics: isPublic ? Boolean(vehicle.showStatistics) : false,
        };

        return apiFetch(`/api/vehicles/${vehicle.id}`, {
          method: "PUT",
          body: payload,
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `No se pudo guardar el vehículo ${vehicle.brand} ${vehicle.model}`);
          }
          return response.json();
        });
      });

      const updatedVehicles = await Promise.all(vehicleUpdates);

      setVehicles(
        updatedVehicles.map((vehicle) => ({
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          isPublic: Boolean(vehicle.isPublic),
          showFuelData: Boolean(vehicle.showFuelData),
          showExpenses: Boolean(vehicle.showExpenses),
          showStatistics: Boolean(vehicle.showStatistics),
        }))
      );

      pushToast("Privacidad actualizada correctamente");
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la privacidad");
      pushToast(saveError.message || "No se pudo guardar la privacidad", "error");
    } finally {
      setSavingPrivacy(false);
    }
  };

  if (loading) {
    return (
      <div className="section-shell py-10 text-slate-100">
        <section className="glass-panel rounded-[2rem] p-8 text-sm text-slate-300">Cargando ajustes...</section>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100">
      <main className="pb-10 pt-6 lg:pb-16">
        <div className="section-shell space-y-6">
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Cuenta</p>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ajustes</h1>
                <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                  Edita tus datos personales y controla qué información compartes con la comunidad.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition hover:border-teal-300/30 hover:bg-slate-900/90 hover:text-teal-100"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver
              </button>
            </div>

            {error ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
              <aside className="rounded-3xl border border-white/10 bg-slate-950/40 p-3">
                <div className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${activeTab === tab.id ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </span>
                        <ChevronRight className={`h-4 w-4 transition ${activeTab === tab.id ? "text-white" : "text-slate-500"}`} />
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="space-y-6">
                {activeTab === "profile" ? (
                  <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5 sm:p-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Perfil</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Información personal</h2>
                      </div>
                    </div>

                    <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-300">Nombre</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                          placeholder="Nombre"
                          value={profileForm.firstName}
                          onChange={handleProfileChange("firstName")}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-300">Apellidos</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20"
                          placeholder="Apellidos"
                          value={profileForm.lastName}
                          onChange={handleProfileChange("lastName")}
                        />
                      </label>

                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-slate-300">Nombre de usuario</span>
                        <div className="relative">
                          <input
                            className={`w-full rounded-2xl border bg-slate-950/60 py-3 pl-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:ring-2 ${
                              usernameError 
                                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" 
                                : "border-white/10 focus:border-teal-300/50 focus:ring-teal-300/20"
                            }`}
                            placeholder="tu_usuario"
                            value={profileForm.username}
                            onChange={(e) => {
                              handleProfileChange("username")(e);
                              setUsernameStatus("idle");
                              setUsernameError("");
                            }}
                            required
                          />
                          <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
                            {usernameStatus === "checking" && <Loader2 className="h-5 w-5 animate-spin text-teal-400" />}
                            {usernameStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                            {usernameStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                          </div>
                        </div>
                        {usernameError && <span className="mt-2 block text-sm text-rose-400">{usernameError}</span>}
                      </label>

                      <div className="sm:col-span-2 flex gap-3 pt-2">
                        <button
                          disabled={savingProfile || !!usernameError || usernameStatus === "checking"}
                          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <Save className="h-4 w-4" />
                          {savingProfile ? "Guardando..." : "Guardar perfil"}
                        </button>
                      </div>
                    </form>
                  </section>
                ) : null}

                {activeTab === "privacy" ? (
                  <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5 sm:p-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Privacidad</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Control de visibilidad</h2>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                        <button
                          type="button"
                          onClick={savePrivacy}
                          disabled={savingPrivacy}
                          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <Save className="h-4 w-4" />
                          {savingPrivacy ? "Guardando..." : "Guardar privacidad"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 space-y-5">
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                        <div className="flex items-center gap-3">
                          <Eye className="h-5 w-5 text-teal-400" />
                          <p className="text-sm font-semibold text-white">Privacidad de la cuenta</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          Define si tu perfil aparece en la comunidad.
                        </p>

                        <div className="mt-4">
                          <Toggle
                            checked={accountPrivacy}
                            onChange={setAccountPrivacy}
                            label={accountPrivacy ? "Cuenta pública" : "Cuenta privada"}
                            hint="Cuando está desactivado, tu perfil no aparecerá en vistas públicas."
                          />
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                        <div className="flex items-center gap-3">
                          <Car className="h-5 w-5 text-teal-400" />
                          <p className="text-sm font-semibold text-white">Privacidad de los vehículos</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          Ajusta la visibilidad de cada vehículo de forma independiente.
                        </p>

                        <div className="mt-4">
                          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-slate-300 focus-within:border-teal-300/30">
                            <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            <input
                              value={vehicleSearch}
                              onChange={(event) => setVehicleSearch(event.target.value)}
                              placeholder="Buscar coche por marca, modelo, año o matrícula"
                              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                            />
                          </label>
                        </div>

                        <div className="mt-4 space-y-4">
                          {filteredVehicles.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/30 px-5 py-6 text-sm text-slate-400">
                              No hay vehículos que coincidan con esa búsqueda.
                            </div>
                          ) : null}

                          {filteredVehicles.map((vehicle) => {
                            const secondaryDisabled = !vehicle.isPublic;
                            const isExpanded = expandedVehicleId === vehicle.id;

                            return (
                              <article key={vehicle.id} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55">
                                <button
                                  type="button"
                                  onClick={() => toggleVehiclePanel(vehicle.id)}
                                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-white/[0.03] sm:px-5"
                                >
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="truncate text-base font-semibold text-white">
                                        {vehicle.brand} {vehicle.model}
                                      </h3>
                                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${vehicle.isPublic ? "bg-teal-400/10 text-teal-100" : "bg-slate-400/10 text-slate-300"}`}>
                                        {vehicle.isPublic ? "Público" : "Privado"}
                                      </span>
                                    </div>
                                  </div>

                                  <ChevronDown
                                    className={`h-5 w-5 shrink-0 text-slate-400 transition duration-200 ${isExpanded ? "rotate-180 text-white" : ""}`}
                                    aria-hidden="true"
                                  />
                                </button>

                                <div className={`grid transition-all duration-300 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                                  <div className="overflow-hidden">
                                    <div className="border-t border-white/10 px-4 py-4 sm:px-5">
                                      <div className="grid gap-3">
                                        <Toggle
                                          checked={vehicle.isPublic}
                                          onChange={(checked) => handleVehicleChange(vehicle.id, "isPublic", checked)}
                                          label="Vehículo público"
                                          hint="Aparece en listados públicos y rankings."
                                        />

                                        <Toggle
                                          checked={vehicle.showFuelData}
                                          disabled={secondaryDisabled}
                                          onChange={(checked) => handleVehicleChange(vehicle.id, "showFuelData", checked)}
                                          label="Mostrar repostajes"
                                          hint="Habilita el historial de repostajes y la media de consumo."
                                        />

                                        <Toggle
                                          checked={vehicle.showExpenses}
                                          disabled={secondaryDisabled}
                                          onChange={(checked) => handleVehicleChange(vehicle.id, "showExpenses", checked)}
                                          label="Mostrar gastos"
                                          hint="Permite ver mantenimientos y costes asociados."
                                        />

                                        <Toggle
                                          checked={vehicle.showStatistics}
                                          disabled={secondaryDisabled}
                                          onChange={(checked) => handleVehicleChange(vehicle.id, "showStatistics", checked)}
                                          label="Mostrar estadísticas y rankings"
                                          hint="Controla si los datos agregados del vehículo se comparten en la comunidad."
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 min-w-[280px] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
              toast.tone === "error" 
                ? "border-rose-400/20 bg-rose-500/15 text-rose-50" 
                : "border-teal-300/20 bg-teal-400/15 text-teal-50"
            }`}
          >
            {toast.tone === "error" ? (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}