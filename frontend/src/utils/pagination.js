export function getPagination(totalItems, pageSize, requestedPage = 1) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(totalPages, Math.max(1, requestedPage));
  return { page, totalPages, startIndex: (page - 1) * pageSize };
}
