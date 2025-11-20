import api from './api';
import type { ApiResponse, LoggedUser } from '../../types';

export const getEmployeeByID = (id: number) => {
  return api.get<ApiResponse<LoggedUser>>(`empleados/${id}`);
};
