/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import { useApiQuery } from "../hooks/useApiQuery";
import type { PendingApprovalItem, PendingApprovalsResponse } from "../types/Pendientes";

interface PendientesAprobacionContextValue {
  items: PendingApprovalItem[];
  totalPendientes: number;
  isLoading: boolean;
  canViewPendingApprovals: boolean;
  refreshPendientes: () => Promise<void>;
}

const PRIVILEGED_ROLES = ["ADMINISTRADOR"];
const EMPTY_RESPONSE: PendingApprovalsResponse = {
  total_pendientes: 0,
  items: [],
};
const FALLBACK_CONTEXT_VALUE: PendientesAprobacionContextValue = {
  items: [],
  totalPendientes: 0,
  isLoading: false,
  canViewPendingApprovals: false,
  refreshPendientes: async () => { },
};

const PendientesAprobacionContext = createContext<PendientesAprobacionContextValue | undefined>(undefined);

export function PendientesAprobacionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const hasMountedRef = useRef(false);
  const roleName = typeof user?.usuario?.rol === "string" ? user.usuario.rol.toUpperCase() : "";
  const canViewPendingApprovals = PRIVILEGED_ROLES.includes(roleName);

  const { data = EMPTY_RESPONSE, isLoading, refetch, setData } = useApiQuery<PendingApprovalsResponse>({
    url: "/pendientes/aprobaciones",
    enabled: canViewPendingApprovals,
    initialData: EMPTY_RESPONSE,
  });

  useEffect(() => {
    if (!canViewPendingApprovals) {
      hasMountedRef.current = false;
      setData(EMPTY_RESPONSE);
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    void refetch();
  }, [canViewPendingApprovals, location.pathname, refetch, setData]);

  const refreshPendientes = useCallback(async () => {
    if (!canViewPendingApprovals) {
      setData(EMPTY_RESPONSE);
      return;
    }

    await refetch();
  }, [canViewPendingApprovals, refetch, setData]);

  const value = useMemo(
    () => ({
      items: data.items,
      totalPendientes: data.total_pendientes,
      isLoading: canViewPendingApprovals ? isLoading : false,
      canViewPendingApprovals,
      refreshPendientes,
    }),
    [canViewPendingApprovals, data.items, data.total_pendientes, isLoading, refreshPendientes],
  );

  return (
    <PendientesAprobacionContext.Provider value={value}>
      {children}
    </PendientesAprobacionContext.Provider>
  );
}

export function usePendientesAprobacion() {
  const context = useContext(PendientesAprobacionContext);
  return context ?? FALLBACK_CONTEXT_VALUE;
}
