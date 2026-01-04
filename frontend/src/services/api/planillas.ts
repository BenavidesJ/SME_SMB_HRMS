import api from "./api";
import type { ApiResponse } from "../../types";

export const getAllPaymentCycles= () => {
  return api.get<ApiResponse<string[]>>("planillas/ciclos_pago"); 
};