export function getPagination(totalItems, pageSize, requestedPage = 1) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(totalPages, Math.max(1, requestedPage));
  return { page, totalPages, startIndex: (page - 1) * pageSize };
}

// Keep the controls bounded even for histories containing thousands of records.
export function getPageNumbers(totalPages, page) {
  const numbers = new Set([1, totalPages]);
  for (let number = Math.max(1, page - 2); number <= Math.min(totalPages, page + 2); number++) numbers.add(number);
  return [...numbers].sort((a, b) => a - b);
}
