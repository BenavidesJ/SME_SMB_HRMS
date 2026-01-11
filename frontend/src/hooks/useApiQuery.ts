/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "../services/api";

type UseApiQueryOptions<T> = {
  url: string;
  enabled?: boolean;
  initialData?: T;
};

export function useApiQuery<T>(opts: UseApiQueryOptions<T>) {
  const { url, enabled = true, initialData } = opts;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<ApiError | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const fetchNow = useCallback(async () => {
    if (!enabled) return;

    // Cancelar request anterior
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const myReqId = ++reqIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest<T>({
        url,
        method: "GET",
        signal: abortRef.current.signal,
      });

      if (myReqId !== reqIdRef.current) return;

      setData(result);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      if (myReqId !== reqIdRef.current) return;

      setError(err);
      setData(initialData);
    } finally {
      if (myReqId === reqIdRef.current) setIsLoading(false);
    }
  }, [enabled, url, initialData]);

  useEffect(() => {
    fetchNow();
    return () => abortRef.current?.abort();
  }, [fetchNow]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchNow,
    setData,
  };
}
