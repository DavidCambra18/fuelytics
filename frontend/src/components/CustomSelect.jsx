import { useEffect, useId, useRef, useState } from "react";

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Selecciona una opción",
  error = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const closeTimerRef = useRef(null);
  const listboxId = useId();

  const current = options.find((o) => o.value === value) || null;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const closeWithDelay = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 80);
  };

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        closeWithDelay();
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [open]);

  useEffect(() => {
    if (highlightedIndex !== -1 && listRef.current) {
      const items = listRef.current.querySelectorAll("li");
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setHighlightedIndex(-1);
    closeWithDelay();
    buttonRef.current?.focus();
  };

  const handleButtonClick = () => {
    if (!disabled) {
      clearCloseTimer();
      setOpen((currentOpen) => {
        if (currentOpen) {
          closeWithDelay();
          return currentOpen;
        }

        return true;
      });
      buttonRef.current?.focus();
    }
  };

  const handleButtonKeyDown = (event) => {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        setHighlightedIndex(0);
        return;
      }

      if (event.key === "ArrowDown") {
        setHighlightedIndex((currentIndex) =>
          currentIndex < options.length - 1 ? currentIndex + 1 : currentIndex
        );
        return;
      }

      if (event.key !== "ArrowDown" && highlightedIndex !== -1) {
        handleOptionClick(options[highlightedIndex].value);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        setHighlightedIndex(Math.max(options.length - 1, 0));
        return;
      }

      setHighlightedIndex((currentIndex) =>
        currentIndex <= 0 ? Math.max(options.length - 1, 0) : currentIndex - 1
      );
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeWithDelay();
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        onKeyDown={handleButtonKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={current ? current.label : placeholder}
        className={[
          "relative w-full text-left rounded-2xl px-4 py-2.5 pr-10 text-sm font-medium transition-all outline-none",
          "bg-slate-950/60",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-teal-300/40",
          error
            ? "border border-rose-400 ring-1 ring-rose-400/25"
            : "border border-white/10",
          open && !error ? "border-teal-400/50 ring-1 ring-teal-400/25" : "",
          "text-white",
        ].join(" ")}
      >
        <span className="block truncate">
          {current ? current.label : placeholder}
        </span>

        {/* Icono chevron */}
        <svg
          className={[
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && !disabled && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-white/6 bg-slate-900/95 p-1 text-sm shadow-2xl"
        >
          {options.length > 0 ? (
            options.map((opt, index) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={value === opt.value}
                onPointerDown={(event) => {
                  event.preventDefault();
                  handleOptionClick(opt.value);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={[
                  "cursor-pointer rounded-md px-3 py-2 transition-colors",
                  highlightedIndex === index
                    ? "bg-slate-800/80 text-white"
                    : "text-slate-200",
                  value === opt.value ? "bg-teal-500/20 text-teal-300 font-medium" : "",
                ].join(" ")}
              >
                <span className="flex items-center justify-between">
                  {opt.label}
                  {value === opt.value && (
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-slate-400">No hay opciones disponibles</li>
          )}
        </ul>
      )}
    </div>
  );
}