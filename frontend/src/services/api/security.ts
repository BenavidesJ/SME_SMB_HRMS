import api from "./api";
import type { ApiResponse } from "../../types";

export const getAllRoles = () => {
  return api.get<ApiResponse<string[]>>("auth/roles");
};