const scopes = [];
const originalInert = new Map();
let overflow, observer;

function updateBackground() {
  const top = scopes.at(-1);
  if (!top) return;
  for (const element of document.body.children) {
    if (!originalInert.has(element)) originalInert.set(element, element.inert);
    element.inert = element.contains(top.dialog) ? originalInert.get(element) : true;
  }
}

export function activateModal(dialog) {
  const scope = { dialog };
  if (!scopes.length) {
    overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    observer = new MutationObserver(updateBackground);
    observer.observe(document.body, { childList: true });
  }
  scopes.push(scope);
  updateBackground();
  return {
    isTop: () => scopes.at(-1) === scope,
    release() {
      const index = scopes.indexOf(scope);
      if (index < 0) return;
      scopes.splice(index, 1);
      if (scopes.length) updateBackground();
      else {
        observer.disconnect();
        for (const [element, inert] of originalInert) element.inert = inert;
        originalInert.clear();
        document.body.style.overflow = overflow;
      }
    },
  };
}
