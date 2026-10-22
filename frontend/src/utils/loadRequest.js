// Cancellation may happen after fetch resolves (including during JSON decoding).
// Every publication, including loading/error, belongs to the current request.
export async function loadRequest({ signal, load, onSuccess, onError, onSettled }) {
  if (signal.aborted) return;
  try {
    const data = await load();
    if (!signal.aborted) onSuccess(data);
  } catch (error) {
    if (!signal.aborted && error.name !== "AbortError") onError(error);
  } finally {
    if (!signal.aborted) onSettled?.();
  }
}
