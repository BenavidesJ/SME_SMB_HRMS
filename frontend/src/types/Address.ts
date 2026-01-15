export type Provincia = { id_provincia: number; nombre: string };
export type Canton = { id_canton: number; id_provincia: number; nombre: string };
export type Distrito = { id_distrito: number; id_canton: number; nombre: string };

export type CantonesPorProvinciaResponse = { provincia: Provincia; cantones: Canton[] };
export type DistritosPorCantonResponse = { canton: Canton; distritos: Distrito[] };