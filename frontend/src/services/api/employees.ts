import api from './api';
import type { ApiResponse, Employee, LoggedUser } from '../../types';

export const getEmployeeByID = (id: number) => {
  return api.get<ApiResponse<LoggedUser>>(`empleados/${id}`);
};

export const createEmployee = (employee: Employee) => {
  return api.post("empleados", employee);
};

export const getAllGenders = () => {
  return api.get<ApiResponse<string[]>>("generos");
};

export const getAllMaritalStatuses = () => {
  return api.get<ApiResponse<string[]>>("estado_civil"); 
};