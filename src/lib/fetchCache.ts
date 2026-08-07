const jsonCache = new Map<string, any>();
const pendingFetches = new Map<string, Promise<any>>();

export async function fetchJsonCached<T = any>(url: string): Promise<T> {
  if (jsonCache.has(url)) {
    return jsonCache.get(url) as T;
  }

  if (pendingFetches.has(url)) {
    return pendingFetches.get(url) as Promise<T>;
  }

  const fetchPromise = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      const data = await res.json();
      jsonCache.set(url, data);
      pendingFetches.delete(url);
      return data;
    })
    .catch((err) => {
      pendingFetches.delete(url);
      throw err;
    });

  pendingFetches.set(url, fetchPromise);
  return fetchPromise;
}
