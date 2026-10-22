import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/auth";
import { apiFetch } from "../services/api";
import { Surface } from "../components/ui/surface";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/field";
import AccountAccessSection from "../components/AccountAccessSection";
import { validateUsername } from "../utils/registrationValidation";
import ViewportPortal from "../components/ViewportPortal";
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
  X,
  Settings as SettingsIcon
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
    <label className="fl-settings-toggle" data-disabled={disabled || undefined}>
      <span className="min-w-0 space-y-1">
        <span className="block text-sm font-medium text-white">{label}</span>
        {hint ? <span className="block text-xs leading-5 text-slate-400">{hint}</span> : null}
      </span>
      <span
        className="fl-toggle-track" data-checked={checked}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className="fl-toggle-thumb"
        />
      </span>
    </label>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, username, setAuth } = useAuth();
  const requestedTab = searchParams.get("tab");
  const activeTab = ["profile", "privacy", "account"].includes(requestedTab) ? requestedTab : "profile";
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
      return;
    }

    const validationError = validateUsername(val);
    if (validationError) {
      const validationTimer = setTimeout(() => {
        setUsernameError(validationError);
        setUsernameStatus("error");
      }, 0);
      return () => clearTimeout(validationTimer);
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await apiFetch(`/api/users/check-username?username=${encodeURIComponent(val)}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          if (controller.signal.aborted) return;
          setUsernameError(payload.message || "El nombre de usuario ya está en uso");
          setUsernameStatus("error");
        } else {
          setUsernameError("");
          setUsernameStatus("success");
        }
      } catch {
        if (!controller.signal.aborted) setUsernameStatus("idle");
      }
    }, 500);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [profileForm.username, username, loading]);

  const tabs = useMemo(
    () => [
      { id: "profile", label: "Perfil", icon: User },
      { id: "privacy", label: "Privacidad", icon: Shield },
      { id: "account", label: "Cuenta", icon: SettingsIcon },
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
    const nextUsername = profileForm.username.trim();
    const validationError = nextUsername !== username ? validateUsername(nextUsername) : "";
    if (validationError) {
      setUsernameError(validationError);
      setUsernameStatus("error");
      return;
    }
    
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
      <div className="section-shell pb-10 text-slate-100">
        <Surface as="section" className="fl-workspace fl-supporting" role="status">Cargando ajustes...</Surface>
      </div>
    );
  }

  return (
    <div className="fl-settings-page">
      <main className="pb-10 lg:pb-16">
        <div className="section-shell space-y-6">
          <Surface as="section" className="fl-workspace fl-settings-workspace">
            <div className="fl-settings-heading">
              <div className="max-w-3xl">
                <h1 className="fl-page-title">Ajustes</h1>
                <p className="fl-supporting mt-3 max-w-[65ch]">
                  Edita tus datos personales y controla qué información compartes con la comunidad.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleGoBack} variant="outline" className="self-start"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver
              </Button>
            </div>

            {error ? (
              <div role="alert" className="fl-feedback-error flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                {error}
              </div>
            ) : null}

            <div className="fl-settings-layout">
              <nav aria-label="Secciones de ajustes" className="fl-settings-navigation">
                <div>
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSearchParams(tab.id === "profile" ? {} : { tab: tab.id }, { replace: true })}
                        aria-pressed={activeTab === tab.id}
                        aria-controls="settings-content"
                        className="fl-settings-navigation-button"
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
              </nav>

              <div id="settings-content" className="min-w-0 space-y-6">
                {activeTab === "account" ? <AccountAccessSection /> : null}
                {activeTab === "profile" ? (
                  <section className="fl-settings-section">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="fl-section-title">Información personal</h2>
                      </div>
                    </div>

                    <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-300">Nombre</span>
                        <Input
                          placeholder="Nombre"
                          value={profileForm.firstName}
                          onChange={handleProfileChange("firstName")}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-300">Apellidos</span>
                        <Input
                          placeholder="Apellidos"
                          value={profileForm.lastName}
                          onChange={handleProfileChange("lastName")}
                        />
                      </label>

                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-slate-300">Nombre de usuario</span>
                        <div className="relative">
                          <Input
                            className="pr-12"
                            aria-invalid={!!usernameError}
                            aria-describedby={usernameError ? "settings-username-error" : undefined}
                            placeholder="tu_usuario"
                            value={profileForm.username}
                            onChange={(e) => {
                              handleProfileChange("username")(e);
                              setUsernameStatus("idle");
                              setUsernameError("");
                            }}
                            required
                          />
                          <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center" aria-hidden="true">
                            {usernameStatus === "checking" && <Loader2 className="h-5 w-5 animate-spin text-teal-400" />}
                            {usernameStatus === "success" && <Check className="h-5 w-5 text-teal-400" />}
                            {usernameStatus === "error" && <X className="h-5 w-5 text-rose-500" />}
                          </div>
                        </div>
                        {usernameError && <span id="settings-username-error" role="status" className="mt-2 block text-sm text-rose-300">{usernameError}</span>}
                      </label>

                      <div className="sm:col-span-2 flex gap-3 pt-2">
                        <Button
                          disabled={savingProfile || !!usernameError || usernameStatus === "checking"} type="submit"
                        >
                          <Save className="h-4 w-4" />
                          {savingProfile ? "Guardando..." : "Guardar perfil"}
                        </Button>
                      </div>
                    </form>
                  </section>
                ) : null}

                {activeTab === "privacy" ? (
                  <section className="fl-settings-section">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="fl-section-title">Control de visibilidad</h2>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                        <Button
                          type="button"
                          onClick={savePrivacy}
                          disabled={savingPrivacy}
                        >
                          <Save className="h-4 w-4" />
                          {savingPrivacy ? "Guardando..." : "Guardar privacidad"}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 space-y-5">
                      <div className="fl-settings-group">
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

                      <div className="fl-settings-group">
                        <div className="flex items-center gap-3">
                          <Car className="h-5 w-5 text-teal-400" />
                          <p className="text-sm font-semibold text-white">Privacidad de los vehículos</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          Ajusta la visibilidad de cada vehículo de forma independiente.
                        </p>

                        <div className="mt-4">
                          <label className="fl-settings-search">
                            <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            <input
                              aria-label="Buscar vehículos por marca, modelo, año o matrícula"
                              value={vehicleSearch}
                              onChange={(event) => setVehicleSearch(event.target.value)}
                              placeholder="Buscar coche por marca, modelo, año o matrícula"
                              className="min-h-11 min-w-0 w-full bg-transparent text-base text-white outline-none placeholder:text-[var(--muted-foreground)]"
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
                              <article key={vehicle.id} className="fl-settings-vehicle">
                                <button
                                  type="button"
                                  onClick={() => toggleVehiclePanel(vehicle.id)}
                                  aria-expanded={isExpanded}
                                  aria-controls={`vehicle-privacy-${vehicle.id}`}
                                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-white/[0.03] sm:px-5"
                                >
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="break-words text-base font-semibold text-white">
                                        {vehicle.brand} {vehicle.model}
                                      </h3>
                                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${vehicle.isPublic ? "bg-teal-400/10 text-teal-100" : "bg-slate-400/10 text-slate-300"}`}>
                                        {vehicle.isPublic ? "Público" : "Privado"}
                                      </span>
                                    </div>
                                  </div>

                                  <ChevronDown
                                    className={`h-5 w-5 shrink-0 text-slate-400 ${isExpanded ? "rotate-180 text-white" : ""}`}
                                    aria-hidden="true"
                                  />
                                </button>

                                <div id={`vehicle-privacy-${vehicle.id}`} inert={!isExpanded} aria-hidden={!isExpanded} className={`grid ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
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
                                          hint="Permite hacer públicos los repostajes asociados al vehículo, como historial de repostajes y consumos medios."
                                        />

                                        <Toggle
                                          checked={vehicle.showExpenses}
                                          disabled={secondaryDisabled}
                                          onChange={(checked) => handleVehicleChange(vehicle.id, "showExpenses", checked)}
                                          label="Mostrar gastos"
                                          hint="Permite hacer públicos los gastos asociados al vehículo"
                                        />

                                        <Toggle
                                          checked={vehicle.showStatistics}
                                          disabled={secondaryDisabled}
                                          onChange={(checked) => handleVehicleChange(vehicle.id, "showStatistics", checked)}
                                          label="Mostrar estadísticas y rankings"
                                          hint="Permite compartir estadísticas y participar en rankings. Para aparecer en ellos también debes compartir los repostajes."
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
          </Surface>
        </div>
      </main>

      <ViewportPortal>
      <div className="pointer-events-none fixed inset-x-4 top-4 z-50 space-y-3 sm:left-auto sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl sm:min-w-[280px] sm:w-auto ${
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
      </ViewportPortal>
    </div>
  );
}
