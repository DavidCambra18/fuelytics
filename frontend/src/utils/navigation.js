let keyboardNavigation = false;
export function setKeyboardNavigation(value) { keyboardNavigation = value; }
export function isKeyboardNavigation() { return keyboardNavigation; }

export function navigationPosition(type, savedPosition) {
  return type === "POP" && savedPosition ? savedPosition : { x: 0, y: 0 };
}

export function navigationFocusTarget(content, active, type) {
  if (type !== "POP" && active?.isConnected && active.matches?.('a[aria-current="page"]')) return null;
  return content.querySelector("h1, h2") || content;
}
