export const MAP_POPUP_PADDING = Object.freeze({ top: 110, right: 5, bottom: 85, left: 5 });

export function popupContentMaxHeight(mapHeight) {
  return Math.max(160, mapHeight - MAP_POPUP_PADDING.top - MAP_POPUP_PADDING.bottom - 10);
}

export function popupPanOffset(map, popup, padding = MAP_POPUP_PADDING) {
  let x = 0, y = 0;
  if (popup.right + padding.right > map.right) x = popup.right - map.right + padding.right;
  if (popup.left - x < map.left + padding.left) x = popup.left - map.left - padding.left;
  if (popup.bottom + padding.bottom > map.bottom) y = popup.bottom - map.bottom + padding.bottom;
  if (popup.top - y < map.top + padding.top) y = popup.top - map.top - padding.top;
  return [x, y];
}

// Stop any earlier pan, then fit the laid-out popup through the public map API.
export function fitPopupImmediately(map, popup) {
  const element = popup.getElement();
  if (!element) return;
  map.stop();
  const offset = popupPanOffset(map.getContainer().getBoundingClientRect(), element.getBoundingClientRect());
  if (offset.some((value) => value !== 0)) map.panBy(offset, { animate: false });
}

export function syncPopupMotion(map, popup, reduced, resized = false) {
  const changed = popup.options.autoPan !== !reduced;
  popup.options.autoPan = !reduced;
  if (resized) popup.options.maxHeight = popupContentMaxHeight(map.getSize().y);
  if (resized || (changed && !reduced)) popup.update();
  if (reduced) fitPopupImmediately(map, popup);
}
