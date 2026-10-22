import { MOTION, motionSeconds } from "./motion.js";

export function registrationStepMotion() {
  return {
    enter: (direction) => ({ opacity: 0, transform: `translateX(${direction * 6}px)` }),
    visible: { opacity: 1, transform: "none", transition: { duration: motionSeconds(MOTION.duration.stepEnter), ease: MOTION.easing.out } },
    exit: (direction) => ({ opacity: 0, transform: `translateX(${direction * -4}px)`, transition: { duration: motionSeconds(MOTION.duration.stepExit), ease: MOTION.easing.out } }),
  };
}

export function noticeMotion(immediate) {
  return {
    initial: { opacity: immediate ? 1 : 0, transform: immediate ? "none" : "translateY(-6px)" },
    animate: { opacity: 1, transform: "none", transition: { duration: motionSeconds(MOTION.duration.noticeEnter, immediate), ease: MOTION.easing.out } },
    exit: { opacity: immediate ? 1 : 0, transform: immediate ? "none" : "translateY(-6px)", transition: { duration: motionSeconds(MOTION.duration.exit, immediate), ease: MOTION.easing.out } },
  };
}
