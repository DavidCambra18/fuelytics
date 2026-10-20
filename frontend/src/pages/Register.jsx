import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Loader2, Check, X, Info } from "lucide-react";
import { Tooltip } from "radix-ui";
import { apiJson } from "../services/api";
import useRegistrationAvailability from "../hooks/useRegistrationAvailability";
import { normalizeRegistration, validateRegistration, validatePassword, REGISTRATION_LIMITS } from "../utils/registrationValidation";
import GoogleSignInPanel from "../components/GoogleSignInPanel";
import PublicFooter from "../components/PublicFooter";

const STEPS = [
  { label: "Correo", title: "Empieza con tu correo", description: "Lo usarás para acceder a tu cuenta de Fuelytics.", fields: ["email"] },
  { label: "Contraseña", title: "Protege tu cuenta", description: "Elige una contraseña y confírmala para continuar.", fields: ["password", "confirmPassword"] },
  { label: "Perfil", title: "Un último paso", description: "Elige tu nombre de usuario. Tu nombre y apellido son opcionales.", fields: ["firstName", "lastName", "username"] },
];

const FIELDS = {
  email: { label: "Correo electrónico", placeholder: "tu@email.com", type: "email", autoComplete: "email", maxLength: REGISTRATION_LIMITS.emailMax, required: true },
  password: { label: "Contraseña", placeholder: "Define tu contraseña", type: "password", autoComplete: "new-password", minLength: REGISTRATION_LIMITS.passwordMin, maxLength: REGISTRATION_LIMITS.passwordMax, required: true, requirements: ["La contraseña debe tener al menos 8 caracteres.", "Puedes utilizar letras, números y símbolos."] },
  confirmPassword: { label: "Confirmar contraseña", placeholder: "Repite tu contraseña", type: "password", autoComplete: "new-password", maxLength: REGISTRATION_LIMITS.passwordMax, required: true },
  firstName: { label: "Nombre (opcional)", placeholder: "Tu nombre", autoComplete: "given-name", maxLength: REGISTRATION_LIMITS.nameMax },
  lastName: { label: "Apellido (opcional)", placeholder: "Tu apellido", autoComplete: "family-name", maxLength: REGISTRATION_LIMITS.nameMax },
  username: { label: "Nombre de usuario", placeholder: "Tu nombre de usuario", autoComplete: "username", minLength: REGISTRATION_LIMITS.usernameMin, maxLength: REGISTRATION_LIMITS.usernameMax, required: true, requirements: ["El nombre de usuario debe tener entre 3 y 15 caracteres.", "Admite letras sin tildes, números, puntos, guiones y guiones bajos.", "Debe estar disponible y no ser un nombre reservado del sistema."] },
};

function PasswordRequirements({ password }) {
  const minimumMet = password.trim().length > 0 && password.length >= REGISTRATION_LIMITS.passwordMin;
  const requirements = [
    { label: "Al menos 8 caracteres", met: minimumMet },
    { label: "Una letra mayúscula", met: /\p{Lu}/u.test(password) },
    { label: "Una letra minúscula", met: /\p{Ll}/u.test(password) },
  ];
  const recommendations = [
    { label: "Un número", met: /[0-9]/.test(password) },
    { label: "Un símbolo", met: /[^\p{L}\p{N}\s]/u.test(password) },
  ];
  const variety = [...requirements.slice(1), ...recommendations].filter(({ met }) => met).length;
  const repetitive = /^(.)\1+$/u.test(password) || /^(.{1,4})\1+$/u.test(password);
  const common = /password|contrase[nñ]a|123456|qwerty|abcdef/i.test(password);
  const valid = !validatePassword(password);
  const level = !password ? 0 : !valid || repetitive || common ? 1 : password.length >= 12 && variety >= 3 ? 3 : 2;
  const strength = ["Sin evaluar", "Baja", "Media", "Alta"][level];
  const color = ["bg-white/10", "bg-rose-400", "bg-amber-300", "bg-teal-300"][level];

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-white">Seguridad orientativa</p>
          <span className={level === 3 ? "text-teal-200" : level === 2 ? "text-amber-200" : level === 1 ? "text-rose-300" : "text-slate-400"}>{strength}</span>
        </div>
        <div role="meter" aria-label="Seguridad orientativa de la contraseña" aria-valuemin={0} aria-valuemax={3} aria-valuenow={level} aria-valuetext={strength} className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none ${color}`} style={{ width: `${level / 3 * 100}%` }} />
        </div>
      </div>
      <div>
        <p className="mb-1 font-semibold text-white">Requisitos de la contraseña</p>
        <ul className="text-sm leading-5">
          {requirements.map(({ label, met }) => <li key={label} className={`flex items-start gap-2 ${met ? "text-teal-200" : "text-slate-400"}`}><Check className={`mt-1 h-3.5 w-3.5 shrink-0 ${met ? "opacity-100" : "opacity-30"}`} aria-hidden="true" /><span>{label}{met ? <span className="sr-only"> Cumplido.</span> : null}</span></li>)}
        </ul>
      </div>
      <div>
        <p className="mb-1 font-semibold text-white">Opcional, para hacerla más segura</p>
        <ul className="text-sm leading-5">
          {recommendations.map(({ label, met }) => <li key={label} className={`flex items-start gap-2 ${met ? "text-teal-200" : "text-slate-400"}`}><Check className={`mt-1 h-3.5 w-3.5 shrink-0 ${met ? "opacity-100" : "opacity-30"}`} aria-hidden="true" /><span>{label}{met ? <span className="sr-only"> Incluido.</span> : null}</span></li>)}
        </ul>
      </div>
      <p className="border-t border-white/10 pt-2 text-xs leading-5 text-slate-300">Evita usar datos personales o una contraseña que ya utilices en otras páginas.</p>
    </div>
  );
}

function FieldRequirements({ label, requirements, password }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <button type="button" aria-label={`Ver requisitos: ${label}`} onClick={(event) => { event.preventDefault(); setOpen(true); }} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-teal-300/10 hover:text-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300">
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" align="start" sideOffset={8} collisionPadding={16} className="z-[100] max-h-[var(--radix-tooltip-content-available-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-teal-300/20 bg-[#0b1620] p-4 text-sm leading-6 text-slate-300 shadow-xl shadow-black/40">
            {password !== undefined ? <PasswordRequirements password={password} /> : <><p className="mb-2 font-semibold text-white">{label}</p><ul className="list-disc space-y-1 pl-4 marker:text-teal-300/70">{requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul></>}
            <Tooltip.Arrow className="fill-[#0b1620]" width={12} height={6} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default function Register() {
  const [values, setValues] = useState({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "", username: "" });
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [serverErrors, setServerErrors] = useState({});
  const [emailRetry, setEmailRetry] = useState(0);
  const [googleRegistration, setGoogleRegistration] = useState(false);
  const panelRef = useRef(null);
  const focusAfterTransition = useRef(false);
  const inFlight = useRef(false);
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const body = normalizeRegistration(values);
  const validation = validateRegistration(body, values.confirmPassword);
  const emailAvailability = useRegistrationAvailability("email", step === 0 ? body.email : "", validation.email, emailRetry);
  const usernameAvailability = useRegistrationAvailability("username", step === 2 ? body.username : "", validation.username);
  const availability = { email: emailAvailability, username: usernameAvailability };
  const errors = Object.fromEntries(Object.keys(FIELDS).map((field) => [field,
    ((values[field] || attempted) && validation[field]) || serverErrors[field] || availability[field]?.error || "",
  ]));
  const currentErrors = STEPS[step].fields.some((field) => errors[field] || validation[field]);
  const checking = step === 0 ? emailAvailability.status === "checking" : step === 2 && usernameAvailability.status === "checking";
  const disabled = submitting || transitioning || checking || currentErrors || (step === 0 && emailAvailability.status !== "success");

  const changeStep = (next) => {
    if (inFlight.current || transitioning) return;
    setDirection(next > step ? 1 : -1);
    setTransitioning(true);
    focusAfterTransition.current = true;
    setAttempted(false);
    setErrorMessage("");
    setStep(next);
  };

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => ({ ...current, [field]: "" }));
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inFlight.current || transitioning) return;
    setAttempted(true);
    if (STEPS[step].fields.some((field) => validation[field] || serverErrors[field] || availability[field]?.error) || checking) return;
    if (step === 0 && emailAvailability.status !== "success") return;
    if (step < 2) {
      changeStep(step + 1);
      return;
    }
    // Validate all steps again: only this final action creates an account.
    const invalidStep = STEPS.findIndex(({ fields }) => fields.some((field) => validation[field] || serverErrors[field]));
    if (invalidStep !== -1) {
      if (invalidStep !== step) changeStep(invalidStep);
      setErrorMessage("Revisa los datos indicados antes de crear tu cuenta.");
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setErrorMessage("");
    try {
      await apiJson("/api/users/register", { method: "POST", body });
      navigate("/login");
    } catch (error) {
      const fields = { ...error.fields };
      // Registration is authoritative if a value was taken after its availability check.
      if (error.status === 409 && !Object.keys(fields).length) {
        if (/correo/i.test(error.message)) fields.email = error.message;
        else if (/nombre de usuario/i.test(error.message)) fields.username = error.message;
      }
      setServerErrors(fields);
      const failedStep = STEPS.findIndex(({ fields: names }) => names.some((field) => fields[field]));
      inFlight.current = false;
      if (failedStep !== -1 && failedStep !== step) changeStep(failedStep);
      setErrorMessage(error.message);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const { label, requirements, ...inputProps } = FIELDS[field];
    const error = errors[field];
    const status = error ? "error" : availability[field]?.status || (values[field] && !validation[field] ? "success" : "idle");
    const warning = field === "email" && emailAvailability.status === "unavailable"
      ? "No se pudo comprobar el correo. Reintenta la comprobación para continuar." : availability[field]?.warning;
    const feedback = error || warning || (field === "email" && status === "success" ? "Este correo está disponible." : "");
    return (
      <div key={field}>
        <div className="mb-2 flex min-h-7 items-center gap-1">
          <label className="text-sm font-medium text-slate-300" htmlFor={`register-${field}`}>{label}</label>
          {requirements ? <FieldRequirements label={label} requirements={requirements} password={field === "password" ? values.password : undefined} /> : null}
        </div>
        <div className="relative">
          <input {...inputProps} id={`register-${field}`} name={field} type={inputProps.type || "text"}
            autoCapitalize={field === "email" || field === "username" ? "none" : undefined}
            spellCheck={field === "email" || field === "username" ? false : undefined}
            value={values[field]} onChange={(event) => updateField(field, event.target.value)}
            aria-invalid={!!error} aria-describedby={feedback ? `register-${field}-feedback` : undefined}
            className={`min-h-12 w-full rounded-2xl border bg-slate-950/60 py-3 pl-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:ring-2 ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-white/10 focus:border-teal-300/50 focus:ring-teal-300/20"}`} />
          <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center" aria-hidden="true">
            {status === "checking" ? <Loader2 className="h-5 w-5 animate-spin text-teal-400 motion-reduce:animate-none" /> : null}
            {status === "success" ? <Check className="h-5 w-5 text-teal-400" /> : null}
            {status === "error" ? <X className="h-5 w-5 text-rose-400" /> : null}
          </div>
        </div>
        {feedback ? <p id={`register-${field}-feedback`} aria-live="polite" className={`mt-2 text-sm leading-6 ${error ? "text-rose-400" : "text-slate-400"}`}>{feedback}</p> : null}
        {field === "email" && emailAvailability.status === "unavailable" ? <button type="button" onClick={() => setEmailRetry((value) => value + 1)} className="mt-1 min-h-11 text-sm font-medium text-teal-200 hover:text-teal-100">Reintentar comprobación</button> : null}
      </div>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col text-slate-100">
      <div className="section-shell grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-6">
        <section className="order-2 space-y-8 lg:order-1">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Nuevo usuario</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Crear cuenta</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">Tu garaje, repostajes y gastos, en un solo lugar. Crea tu cuenta en tres sencillos pasos.</p>
          </div>
        </section>
        <section className="order-1 glass-panel min-w-0 w-full rounded-[2rem] p-6 shadow-2xl shadow-black/25 sm:p-8 lg:order-2">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Registro</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Crea tu cuenta</h2>
          <form onSubmit={handleSubmit} noValidate hidden={googleRegistration} aria-busy={submitting || transitioning} className="mt-6">
            <ol aria-label="Pasos del registro" className="mb-7 grid grid-cols-3 gap-2">
              {STEPS.map(({ label }, index) => <li key={label} aria-current={step === index ? "step" : undefined} className="min-w-0">
                <div className={`mb-2 h-1 rounded-full ${index <= step ? "bg-teal-300" : "bg-white/10"}`} />
                <span className={`flex items-center gap-1.5 text-[11px] sm:text-xs ${index === step ? "font-semibold text-teal-200" : "text-slate-400"}`}>
                  {index < step ? <Check className="hidden h-3 w-3 shrink-0 sm:block" aria-hidden="true" /> : <span className="hidden sm:inline">{index + 1}.</span>}{label}
                </span>
              </li>)}
            </ol>
            {errorMessage ? <p role="alert" className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{errorMessage}</p> : null}
            <div className="overflow-hidden" inert={transitioning}>
              <AnimatePresence initial={false} mode="wait" custom={direction}>
                <motion.div key={step} ref={panelRef} custom={direction}
                  variants={{ enter: (sign) => ({ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : sign * 16 }), visible: { opacity: 1, x: 0 }, exit: (sign) => ({ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : sign * -12 }) }}
                  initial="enter" animate="visible" exit="exit" transition={{ duration: reducedMotion ? 0 : 0.16, ease: "easeOut" }}
                  onAnimationComplete={(definition) => {
                    if (definition !== "visible") return;
                    setTransitioning(false);
                    if (focusAfterTransition.current) {
                      focusAfterTransition.current = false;
                      window.requestAnimationFrame(() => panelRef.current?.querySelector("input")?.focus({ preventScroll: true }));
                    }
                  }} className="px-1 pb-1">
                  <h3 className="text-lg font-semibold text-white">{STEPS[step].title}</h3>
                  <p className="mb-6 mt-2 text-sm leading-6 text-slate-400">{STEPS[step].description}</p>
                  <fieldset disabled={submitting || transitioning} className="space-y-4">
                    <legend className="sr-only">{STEPS[step].label}</legend>
                    {STEPS[step].fields.map(renderField)}
                  </fieldset>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row">
              {step > 0 ? <button type="button" disabled={submitting || transitioning} onClick={() => changeStep(step - 1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Atrás</button> : null}
              <button type="submit" disabled={disabled} className="mx-auto inline-flex min-h-11 w-full max-w-[400px] items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">
                {submitting || checking ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                {submitting ? "Creando cuenta…" : checking ? "Comprobando…" : step === 2 ? "Crear cuenta" : "Continuar"}
                {!submitting && !checking && step < 2 ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
              </button>
            </div>
            <p className="sr-only" role="status">Paso {step + 1} de 3: {STEPS[step].label}</p>
          </form>
          <div hidden={!googleRegistration && step !== 0}><GoogleSignInPanel onRegistrationChange={setGoogleRegistration} /></div>
          <p hidden={googleRegistration} className="mt-5 text-sm text-slate-400">¿Ya tienes cuenta? <Link to="/login" className="font-medium text-white transition hover:text-teal-200">Inicia sesión</Link></p>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}
