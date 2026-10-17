import { createPortal } from "react-dom";

// Keep fixed overlays outside animated or blurred containers that can constrain them.
export default function ViewportPortal({ children }) {
  return createPortal(children, document.body);
}
