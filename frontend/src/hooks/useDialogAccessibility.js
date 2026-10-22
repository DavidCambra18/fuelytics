import { useLayoutEffect, useId, useRef } from "react";
import useOverlayMotion from "./useOverlayMotion";
import { activateModal } from "../utils/modalScope";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export default function useDialogAccessibility(open, onClose, kind = "dialog") {
  const dialogRef = useRef(null);
  const { close, reopen, isClosing } = useOverlayMotion(open, dialogRef, onClose, kind);
  const closeRef = useRef(close);
  const titleId = useId();

  useLayoutEffect(() => {
    closeRef.current = close;
  }, [close]);

  useLayoutEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const scope = activateModal(dialog);
    const getFocusable = () => [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => element.tabIndex >= 0 && element.getClientRects().length && !element.closest("[inert], [hidden]"));

    const focusableElements = getFocusable();
    (focusableElements[0] || dialog)?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (!scope.isTop()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const currentFocusableElements = getFocusable();
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

    const containFocus = (event) => {
      if (scope.isTop() && !dialog.contains(event.target)) (getFocusable()[0] || dialog).focus({ preventScroll: true });
    };
    const preventClosingSubmit = (event) => { if (isClosing()) { event.preventDefault(); event.stopPropagation(); } };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", containFocus);
    dialog.addEventListener("submit", preventClosingSubmit, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", containFocus);
      dialog.removeEventListener("submit", preventClosingSubmit, true);
      const shouldRestore = dialog.contains(document.activeElement) || document.activeElement === document.body;
      scope.release();
      if (shouldRestore && previousFocus?.isConnected && !previousFocus.closest?.("[inert]")) previousFocus.focus?.({ preventScroll: true });
    };
  }, [open, isClosing]);

  return { dialogRef, titleId, close, reopen, isClosing };
}
