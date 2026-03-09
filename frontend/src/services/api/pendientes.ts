import { apiRequest } from "./request";
import type { PendingApprovalsResponse } from "../../types/Pendientes";

export const getPendingApprovals = () => {
  return apiRequest<PendingApprovalsResponse>({
    url: "/pendientes/aprobaciones",
    method: "GET",
  });
};
