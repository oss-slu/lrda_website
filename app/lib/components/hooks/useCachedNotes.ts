// hooks/useCachedNotes.ts
import { useEffect, useState } from 'react';

export function useCachedNotes<T>(
  key: string,
  fetchData: () => Promise<T>,
  ttlMs: number = 1000 * 60 * 10 // default: 10 minutes
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const cached = localStorage.getItem(key);
      const cachedAt = localStorage.getItem(`${key}_ts`);

      if (cached && cachedAt && Date.now() - parseInt(cachedAt) < ttlMs) {
        setData(JSON.parse(cached));
        setLoading(false);
      } else {
        const result = await fetchData();
        localStorage.setItem(key, JSON.stringify(result));
        localStorage.setItem(`${key}_ts`, Date.now().toString());
        setData(result);
        setLoading(false);
      }
    };

    load();
  }, [key, fetchData, ttlMs]);

  return { data, loading };
}
