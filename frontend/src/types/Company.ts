export interface Department {
  id: number,
  departamento?: string
  nombre?: string
}

export interface JobPosition {
  id: number
  puesto: string
  departamento?: string
  nombre?: string
  salario_ref_minimo: string
  salario_ref_maximo: string
  estado: string
}
