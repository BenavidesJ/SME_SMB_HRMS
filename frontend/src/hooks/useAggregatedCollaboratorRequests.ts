import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

interface UseAggregatedCollaboratorRequestsOptions<TItem> {
  enabled?: boolean;
  collaboratorIds: number[];
  buildUrl: (id: number) => string;
  mapItems?: (items: TItem[], collaboratorId: number) => TItem[];
}

export function useAggregatedCollaboratorRequests<TItem>({
  enabled = true,
  collaboratorIds,
  buildUrl,
  mapItems,
}: UseAggregatedCollaboratorRequestsOptions<TItem>) {
  const [data, setData] = useState<TItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stableIds = useMemo(
    () => collaboratorIds.filter((id) => Number.isInteger(id) && id > 0),
    [collaboratorIds],
  );
  const idsKey = stableIds.join(",");

  const fetchAll = useCallback(async () => {
    if (!enabled || stableIds.length === 0) {
      setData([]);
      setError(null);
      return [] as TItem[];
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        stableIds.map(async (collaboratorId) => {
          const items = await apiRequest<TItem[]>({ url: buildUrl(collaboratorId) });
          return mapItems ? mapItems(items ?? [], collaboratorId) : (items ?? []);
        }),
      );

      const merged = results.flat();
      setData(merged);
      return merged;
    } catch (fetchError) {
      const nextError = fetchError instanceof Error ? fetchError : new Error("No se pudieron recuperar las solicitudes.");
      setError(nextError);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, [buildUrl, enabled, idsKey, mapItems, stableIds]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return { data, isLoading, error, refetch: fetchAll };
}