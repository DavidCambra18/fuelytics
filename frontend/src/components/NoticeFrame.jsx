import { forwardRef } from "react";
import { motion, useIsPresent } from "motion/react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import { noticeMotion } from "../utils/feedbackMotion";
import { isKeyboardNavigation } from "../utils/navigation";

// Presentation for the existing notification lists; timers and messages stay in their owners.
const NoticeFrame = forwardRef(function NoticeFrame({ tone, children, ...props }, ref) {
  const present = useIsPresent();
  const immediate = usePrefersReducedMotion() || isKeyboardNavigation() || tone === "error";
  return <motion.div {...props} {...noticeMotion(immediate)} ref={ref} inert={!present} aria-hidden={!present || undefined}>
    {children}
  </motion.div>;
});
export default NoticeFrame;
