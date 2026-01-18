/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useRef, useState } from "react";
import { apiRequest, ApiError } from "../services/api";
import type { HttpMethod } from "../types";

type UseApiMutationOptions<_TBody, _TResponse, TKey = unknown> = {
  url: string | ((key: TKey) => string);
  method: Exclude<HttpMethod, "GET">;
};

export function useApiMutation<TBody, TResponse, TKey = unknown>(
  opts: UseApiMutationOptions<TBody, TResponse, TKey>,
) {
  const { url, method } = opts;

  const [data, setData] = useState<TResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Overloads
  async function mutate(body: TBody): Promise<TResponse>;
  async function mutate(key: TKey, body?: TBody): Promise<TResponse>;
  async function mutate(arg1: any, arg2?: any) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      if (arg2 === undefined) {
        const body = arg1 as TBody;
        const finalUrl = typeof url === "function" ? url(arg1 as TKey) : url;

        const result = await apiRequest<TResponse, TBody>({
          url: finalUrl,
          method,
          body,
          signal: abortRef.current.signal,
        });

        setData(result);
        return result;
      }

      const key = arg1 as TKey;
      const body = arg2 as TBody | undefined;
      const finalUrl = typeof url === "function" ? url(key) : url;

      const result = await apiRequest<TResponse, TBody>({
        url: finalUrl,
        method,
        ...(body !== undefined ? { body } : {}),
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
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mutateCb = useCallback(mutate as any, [url, method]);

  return { mutate: mutateCb as typeof mutate, data, isLoading, error };
}
