/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "../services/api";

type UseApiQueryOptions<T> = {
  url: string;
  enabled?: boolean;
  initialData?: T;
};

export function useApiQuery<T>(opts: UseApiQueryOptions<T>) {
  const { url, enabled = true, initialData } = opts;
  const initialDataRef = useRef<T | undefined>(initialData);
  const shouldFetch = enabled && Boolean(url);

  if (initialDataRef.current === undefined && initialData !== undefined) {
    initialDataRef.current = initialData;
  }

  const [data, setData] = useState<T | undefined>(initialDataRef.current);
  const [isLoading, setIsLoading] = useState<boolean>(shouldFetch);
  const [error, setError] = useState<ApiError | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const fetchNow = useCallback(async () => {
    if (!shouldFetch) {
      setIsLoading(false);
      return;
    }

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
      if (err?.name === "AbortError" || err?.code === "ERR_CANCELED" || axios.isCancel(err)) return;
      if (myReqId !== reqIdRef.current) return;

      setError(err);
      setData(initialDataRef.current);
    } finally {
      if (myReqId === reqIdRef.current) setIsLoading(false);
    }
  }, [shouldFetch, url]);

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
