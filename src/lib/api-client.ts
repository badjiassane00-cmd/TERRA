/** Shared same-origin API transport for browser components. */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return fetch(input, { ...init, headers, credentials: init.credentials ?? "same-origin" });
}

export async function apiJson<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(input, init);
  const payload = await response.json() as T;
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : `La requête a échoué (${response.status}).`;
    throw new Error(message);
  }
  return payload;
}
