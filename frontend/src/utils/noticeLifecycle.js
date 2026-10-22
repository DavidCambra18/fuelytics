export function expireNotice(current, expectedId) {
  return current?.id === expectedId ? null : current;
}
