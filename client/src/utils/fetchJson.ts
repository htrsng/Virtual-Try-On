const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const fetchJson = async <T,>(path: string): Promise<T> => {
  const requestUrls = API_URL ? [`${API_URL}${path}`, path] : [path];
  let lastError: unknown = null;

  for (const requestUrl of requestUrls) {
    try {
      const response = await fetch(requestUrl);
      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Request failed (${response.status}) for ${requestUrl}: ${responseText.slice(0, 180)}`,
        );
      }

      if (!contentType.includes('application/json')) {
        const responseText = await response.text();

        if (requestUrl !== path) {
          lastError = new Error(
            `Non-JSON response from ${requestUrl}: ${responseText.slice(0, 180)}`,
          );
          continue;
        }

        throw new Error(
          `Expected JSON from ${requestUrl} but received ${contentType || 'unknown content type'}: ${responseText.slice(0, 180)}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch ${path}`);
};
