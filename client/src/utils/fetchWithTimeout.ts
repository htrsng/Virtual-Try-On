/**
 * Wrapper für fetch mit Timeout-Schutz
 * Prevents indefinite hangs when external APIs (like Gemini) are slow or unresponsive
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = 8000
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new Error(`TIMEOUT: Request took longer than ${timeout}ms to respond`);
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}
