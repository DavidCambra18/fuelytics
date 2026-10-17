import { motion, useReducedMotion } from "motion/react";

export default function PageTransition({ children }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: reducedMotion ? 1 : 0, transition: { duration: reducedMotion ? 0 : 0.12 } }}
      transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}
