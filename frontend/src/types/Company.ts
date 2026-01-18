export interface Department {
  id: number,
  departamento: string
}

export interface JobPosition {
  id: number
  puesto: string
  departamento: string
  salario_ref_minimo: string
  salario_ref_maximo: string
  estado: string
}
