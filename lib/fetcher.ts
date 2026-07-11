export async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Request failed");
    throw error;
  }
  return res.json();
}

export async function fetcherWithQuery([url, params]: [string, Record<string, string>]) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`);
  if (!res.ok) {
    const error = new Error("Request failed");
    throw error;
  }
  return res.json();
}
