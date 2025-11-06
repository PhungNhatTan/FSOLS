// src/hooks/useFetch.ts
import { useState, useEffect, useCallback } from "react";

export function useFetch<T>(
  fetchFn: (() => Promise<T>) | null,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [reloadFlag, setReloadFlag] = useState<number>(0);

  const fetchData = useCallback(async () => {
    if (!fetchFn) return;
    try {
      setLoading(true);
      const result = await fetchFn();
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, reloadFlag, deps]);

  const refetch = useCallback(() => {
    setReloadFlag((prev) => prev + 1);
  }, []);

  return { data, error, loading, refetch };
}
