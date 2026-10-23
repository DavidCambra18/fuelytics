// Optional sections must distinguish a confirmed empty result from an unavailable resource.
export async function optionalResource(request, { signal, fallback, message }) {
  try {
    const response = await request;
    if (!response.ok) throw new Error(message);
    const data = await response.json();
    return signal?.aborted ? null : { data: data ?? fallback, error: "" };
  } catch {
    return signal?.aborted ? null : { data: fallback, error: message };
  }
}
