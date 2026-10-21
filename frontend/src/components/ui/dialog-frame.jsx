import { X } from "lucide-react";
import ViewportPortal from "../ViewportPortal";
import { Button } from "./button";
import { Surface } from "./surface";

// Presentation only: the caller retains its dialog lifecycle and focus hook.
export function DialogFrame({ dialogRef, titleId, title, description, onClose, children }) {
  return (
    <ViewportPortal>
      <div className="fl-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
        <Surface variant="floating" className="fl-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? `${titleId}-description` : undefined} tabIndex={-1}>
          <header className="fl-dialog-header">
            <div className="min-w-0">
              <h3 id={titleId} className="fl-dialog-title">{title}</h3>
              {description ? <p id={`${titleId}-description`} className="fl-dialog-description">{description}</p> : null}
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}><X aria-hidden="true" /></Button>
          </header>
          <div className="fl-dialog-body">{children}</div>
        </Surface>
      </div>
    </ViewportPortal>
  );
}
