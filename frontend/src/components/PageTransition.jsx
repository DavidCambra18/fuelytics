import { motion } from "motion/react";

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}
