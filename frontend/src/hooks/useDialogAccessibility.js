import { useEffect, useId, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export default function useDialogAccessibility(open, onClose) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableElements = dialog ? [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)] : [];
    (focusableElements[0] || dialog)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const currentFocusableElements = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)];
      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = currentFocusableElements[0];
      const last = currentFocusableElements.at(-1);

      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  return { dialogRef, titleId };
}
