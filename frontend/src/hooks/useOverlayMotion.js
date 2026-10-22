import { useCallback, useLayoutEffect, useRef } from "react";
import usePrefersReducedMotion from "./usePrefersReducedMotion";
import { prefersReducedMotion } from "../utils/motion";
import { isKeyboardNavigation } from "../utils/navigation";
import { createOverlayMotion } from "../utils/overlayMotion";

export default function useOverlayMotion(open, panelRef, onClose, kind = "dialog") {
  const reduced = usePrefersReducedMotion();
  const motion = useRef(null);
  const closeRef = useRef(onClose);
  useLayoutEffect(() => { closeRef.current = onClose; }, [onClose]);
  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    const controller = createOverlayMotion(panelRef.current, { kind });
    motion.current = controller;
    controller.play(true, prefersReducedMotion() || isKeyboardNavigation());
    return () => { controller.cancel(); motion.current = null; };
  }, [open, panelRef, kind]);
  useLayoutEffect(() => {
    if (!reduced || !motion.current) return;
    if (motion.current.isClosing()) motion.current.play(false, true, () => closeRef.current?.());
    else motion.current.play(true, true);
  }, [reduced]);
  const close = useCallback(() => {
    const controller = motion.current;
    if (!controller) { closeRef.current?.(); return; }
    if (controller.isClosing()) return;
    controller.play(false, prefersReducedMotion() || isKeyboardNavigation(), () => closeRef.current?.());
  }, []);
  const reopen = useCallback(() => motion.current?.play(true, prefersReducedMotion() || isKeyboardNavigation()), []);
  const isClosing = useCallback(() => !!motion.current?.isClosing(), []);
  return { close, reopen, isClosing };
}
