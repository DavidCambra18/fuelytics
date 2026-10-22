import { useEffect, useMemo } from "react";
import { createActionGate } from "../utils/actionGate";

export default function useActionGuard() {
  const gate = useMemo(() => createActionGate(), []);
  useEffect(() => {
    gate.activate();
    return () => gate.dispose();
  }, [gate]);
  return gate;
}
