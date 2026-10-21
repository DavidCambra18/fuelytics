import { useState } from "react";
import { getPagination } from "../utils/pagination";

export default function usePagination(totalItems, pageSize) {
  const [state, setState] = useState({ totalItems, page: 1 });
  const pagination = getPagination(totalItems, pageSize, state.page);

  // Reconcile before rendering, so removing a last page never flashes empty
  // or returns unexpectedly when another record is added later.
  if (state.totalItems !== totalItems) {
    setState({ totalItems, page: pagination.page });
  }

  const setPage = (nextPage) => {
    setState((current) => {
      const currentPage = getPagination(totalItems, pageSize, current.page).page;
      const requested = typeof nextPage === "function" ? nextPage(currentPage) : nextPage;
      return { totalItems, page: getPagination(totalItems, pageSize, requested).page };
    });
  };

  return { ...pagination, setPage };
}
