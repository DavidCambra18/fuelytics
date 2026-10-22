import useMediaQuery from "./useMediaQuery";
import { REDUCED_MOTION_QUERY } from "../utils/motion";

// Unlike a mount-time snapshot, this responds to changes while the app is open.
export default function usePrefersReducedMotion() {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}
