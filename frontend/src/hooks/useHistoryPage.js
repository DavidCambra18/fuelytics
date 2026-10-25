import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../services/api";
import { loadRequest } from "../utils/loadRequest";

const empty = { content: [], totalElements: 0, totalPages: 1, page: 1, summary: {} };
export default function useHistoryPage(kind, vehicleId, year) {
  const [requestedPage, requestPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState({ key: "", data: empty, error: "" });
  const key = `${kind}:${vehicleId}:${requestedPage}:${year ?? ""}:${revision}`;
  const data = snapshot.data;
  useEffect(() => {
    const controller = new AbortController();
    if (!vehicleId) return () => controller.abort();
    loadRequest({
      signal: controller.signal,
      load: () => apiJson(`/api/${kind}/vehicle/${vehicleId}/page?page=${requestedPage}&size=15${year ? `&year=${year}` : ""}`, { signal: controller.signal }),
      onSuccess: (data) => setSnapshot({ key, data, error: "" }),
      onError: (failure) => setSnapshot((current) => ({ key, data: current.data, error: failure.message || "No se pudo cargar el historial" })),
    });
    return () => controller.abort();
  }, [kind, vehicleId, requestedPage, year, revision, key]);
  const setPage = useCallback((next) => requestPage(typeof next === "function" ? next(data.page) : next), [data.page]);
  const reload = useCallback((firstPage = false) => {
    if (firstPage) requestPage(1);
    setRevision((value) => value + 1);
  }, []);
  return { data, loading: snapshot.key !== key, error: snapshot.key === key ? snapshot.error : "", setPage, reload };
}
