import { useEffect, useRef } from "react";

export default function useValidationFocus(errors) {
  const formRef = useRef(null);
  useEffect(() => {
    if (Object.keys(errors).length) {
      formRef.current?.querySelector('[aria-invalid="true"]:not(:disabled)')?.focus();
    }
  }, [errors]);
  return formRef;
}
