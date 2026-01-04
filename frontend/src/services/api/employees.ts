import api from './api';
import type { ApiResponse, Employee, EmployeeRow, Puesto, TipoJornada } from '../../types';

export const getEmployees = () => {
  return api.get<ApiResponse<EmployeeRow[]>>("empleados");
};
export const getEmployeeByID = (id: number) => {
  return api.get<ApiResponse<EmployeeRow>>(`empleados/${id}`);
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

export const getAllScheduleTypes = () => {
  return api.get<ApiResponse<TipoJornada[]>>("tipos_jornada"); 
};

export const getAllJobPositions= () => {
  return api.get<ApiResponse<Puesto[]>>("puestos"); 
};

export const getAllContractTypes= () => {
  return api.get<ApiResponse<string[]>>("tipos_contrato"); 
};