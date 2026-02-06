import api from './api';
import type { ApiResponse, ContractPayload, Contrato, Employee, EmployeeRow, Puesto, TipoJornada } from '../../types';
import type { CantonesPorProvinciaResponse, DistritosPorCantonResponse } from '../../types/Address';

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

export const getAllJobPositions = () => {
  return api.get<ApiResponse<Puesto[]>>("puestos");
};

export const getAllContractTypes = () => {
  return api.get<ApiResponse<string[]>>("tipos_contrato");
};

export const createAndAssignContract = (contract: ContractPayload) => {
  const { id_colaborador, ...payload } = contract;
  return api.post(`empleados/${id_colaborador}/contratos`, payload);
};

export const getAllContractsByEmployee = (id: number) => {
  return api.get<ApiResponse<Contrato[]>>(`empleados/${id}/contratos`);
};

export const getCantonesPorProvincia = (id_provincia: number) => {
  return api.get<ApiResponse<CantonesPorProvinciaResponse>>(`provincias/${id_provincia}/cantones`);
};

export const getDistritosPorCanton = (id_provincia: number) => {
  return api.get<ApiResponse<DistritosPorCantonResponse>>(`cantones/${id_provincia}/distritos`);
};

export const deleteJornada = (id: number) => {
  return api.delete(`tipos_jornada/${id}`);
};