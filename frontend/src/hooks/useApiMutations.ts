/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useRef, useState } from "react";
import { apiRequest, ApiError } from "../services/api";
import type { HttpMethod } from "../types";

type UseApiMutationOptions<TBody, _TResponse> = {
  url: string | ((body: TBody) => string);
  method: Exclude<HttpMethod, "GET">;
};

export function useApiMutation<TBody, TResponse>(opts: UseApiMutationOptions<TBody, TResponse>) {
  const { url, method } = opts;

  const [data, setData] = useState<TResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async (body: TBody) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const finalUrl = typeof url === "function" ? url(body) : url;

        const result = await apiRequest<TResponse, TBody>({
          url: finalUrl,
          method,
          body,
          signal: abortRef.current.signal,
        });

        setData(result);
        return result;
      } catch (err: any) {
        if (err?.name === "AbortError") return null;
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [url, method],
  );

  return { mutate, data, isLoading, error };
}
