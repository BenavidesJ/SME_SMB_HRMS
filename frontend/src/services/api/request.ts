/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./api";
import { ApiError } from "./apiError";
import type { HttpMethod } from "../../types";

export async function apiRequest<TResponse, TBody = unknown>(opts: {
  url: string;
  method?: HttpMethod;
  body?: TBody;
  params?: Record<string, any>;
  signal?: AbortSignal;
}) {
  const { url, method = "GET", body, params, signal } = opts;

  try {
    const res = await api.request({
      url,
      method,
      data: body,
      params,
      signal,
    });

    // { success, status_code, message, data }
    const envelope = res.data;

    if (envelope && envelope.success === false) {
      throw new ApiError(envelope.message || "Error", envelope.status_code, envelope);
    }

    return (envelope?.data ?? null) as TResponse;
  } catch (err: any) {
    // Aca ya pasó por interceptor, solo normaliza para el hook
    const status = err?.response?.status;
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Error en la solicitud";

    throw new ApiError(msg, status, err?.response?.data);
  }
}
