import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import { MOTION, motionSeconds } from "../utils/motion";
import { motion } from "motion/react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const reducedMotion = usePrefersReducedMotion();
  const { pathname } = useLocation();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: reducedMotion ? 1 : 0, transition: { duration: motionSeconds(MOTION.duration.exit, reducedMotion) } }}
      transition={{ duration: motionSeconds(MOTION.duration.page, reducedMotion), ease: MOTION.easing.page }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}
