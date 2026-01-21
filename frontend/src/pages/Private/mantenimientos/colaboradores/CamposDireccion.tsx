import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { SimpleGrid, Heading } from "@chakra-ui/react";
import { InputField } from "../../../../components/forms";
import { useFormContext, useWatch } from "react-hook-form";
import type { Canton, Distrito, Provincia } from "../../../../types/Address";
import { toTitleCase } from "../../../../utils";
import { getCantonesPorProvincia, getDistritosPorCanton } from "../../../../services/api/employees";

type SelectOption = { label: string; value: string };

type DireccionFieldsProps = {
  provincias: Provincia[];
  mode?: "create" | "edit";
};

export function DireccionFields({ provincias, mode = "create" }: DireccionFieldsProps) {
  const { setValue, getValues } = useFormContext();

  const provinciaNombre = useWatch({ name: "provincia" }) as string;
  const cantonNombre = useWatch({ name: "canton" }) as string;

  const [cantones, setCantones] = useState<Canton[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [loadingCantones, setLoadingCantones] = useState(false);
  const [loadingDistritos, setLoadingDistritos] = useState(false);


  const hydratedRef = useRef(false);
  const prevProvinciaRef = useRef<string>("");
  const prevCantonRef = useRef<string>("");

  const provinciaOptions = useMemo(
    () => provincias.map((p) => ({ label: toTitleCase(p.nombre), value: p.nombre })),
    [provincias],
  );

  const cantonOptions: SelectOption[] = useMemo(
    () => cantones.map((c) => ({ label: toTitleCase(c.nombre), value: c.nombre })),
    [cantones],
  );

  const distritoOptions: SelectOption[] = useMemo(
    () => distritos.map((d) => ({ label: toTitleCase(d.nombre), value: d.nombre })),
    [distritos],
  );

  const findProvinciaIdByNombre = useCallback(
    (nombre: string) => provincias.find((p) => p.nombre === nombre)?.id_provincia,
    [provincias],
  );

  const findCantonIdByNombre = useCallback(
    (nombre: string) => cantones.find((c) => c.nombre === nombre)?.id_canton,
    [cantones],
  );

  useEffect(() => {
    const run = async () => {
      if (!provinciaNombre) {
        setCantones([]);
        setDistritos([]);
        setValue("canton", "");
        setValue("distrito", "");
        prevProvinciaRef.current = "";
        prevCantonRef.current = "";
        hydratedRef.current = mode !== "edit" ? false : hydratedRef.current;
        return;
      }

      const provinciaId = findProvinciaIdByNombre(provinciaNombre);
      if (!provinciaId) return;

      const prevProvincia = prevProvinciaRef.current;
      const provinciaChanged = prevProvincia && prevProvincia !== provinciaNombre;

      const shouldResetDependents =
        mode === "create"
          ? true
          : hydratedRef.current && provinciaChanged;

      if (shouldResetDependents) {
        setCantones([]);
        setDistritos([]);
        setValue("canton", "");
        setValue("distrito", "");
      } else {
        setCantones([]);
        setDistritos([]);
      }

      setLoadingCantones(true);
      try {
        const resp = await getCantonesPorProvincia(provinciaId);
        const nextCantones = resp.data.data.cantones as Canton[];
        setCantones(nextCantones);
      } finally {
        setLoadingCantones(false);
      }

      prevProvinciaRef.current = provinciaNombre;
    };

    run();
  }, [provinciaNombre, findProvinciaIdByNombre, setValue, mode]);

  /**
   * Carga distritos por cantón.
   * - create: resetea distrito al cambiar cantón
   * - edit: NO resetea si es hidratación inicial; solo asegura lista
   */
  useEffect(() => {
    const run = async () => {
      if (!cantonNombre) {
        setDistritos([]);
        setValue("distrito", "");
        prevCantonRef.current = "";
        return;
      }

      const prevCanton = prevCantonRef.current;
      const cantonChanged = prevCanton && prevCanton !== cantonNombre;

      const shouldResetDistrito =
        mode === "create"
          ? true
          : hydratedRef.current && cantonChanged;

      if (shouldResetDistrito) {
        setDistritos([]);
        setValue("distrito", "");
      } else {
        setDistritos([]);
      }

      const cantonId = findCantonIdByNombre(cantonNombre);
      if (!cantonId) return;

      setLoadingDistritos(true);
      try {
        const resp = await getDistritosPorCanton(cantonId);
        const nextDistritos = resp.data.data.distritos as Distrito[];
        setDistritos(nextDistritos);
      } finally {
        setLoadingDistritos(false);
      }

      prevCantonRef.current = cantonNombre;
    };

    run();
  }, [cantonNombre, findCantonIdByNombre, setValue, mode]);

  /**
   * ✅ “Hidratación” para edit:
   * Cuando el form ya trae defaults (provincia/canton/distrito),
   * marcamos hydratedRef = true para que después sí haga cascada
   * si el usuario cambia provincia/canton manualmente.
   */
  useEffect(() => {
    if (mode !== "edit") return;

    // si ya hay valores iniciales, marcamos como hidratado
    const prov = getValues("provincia") as string;
    const cant = getValues("canton") as string;

    if (prov || cant) hydratedRef.current = true;
  }, [mode, getValues]);

  const cantonDisabled = !provinciaNombre || loadingCantones || cantones.length === 0;
  const distritoDisabled = !cantonNombre || loadingDistritos || distritos.length === 0;

  return (
    <>
      <Heading as="h3" size="md">
        Dirección
      </Heading>

      <SimpleGrid columns={{ base: 2, md: 3 }} gap={2}>
        <InputField
          fieldType="select"
          label="Provincia"
          name="provincia"
          disableSelectPortal
          required
          placeholder={provincias.length ? "Seleccione una opción" : "Cargando..."}
          options={provinciaOptions}
          rules={{ required: "El campo es obligatorio", setValueAs: (v) => String(v ?? "").trim() }}
          selectRootProps={{ disabled: provincias.length === 0 }}
        />

        <InputField
          fieldType="select"
          label="Cantón"
          name="canton"
          disableSelectPortal
          required
          placeholder={loadingCantones ? "Cargando..." : "Seleccione una opción"}
          options={cantonOptions}
          rules={{ required: "El campo es obligatorio", setValueAs: (v) => String(v ?? "").trim() }}
          selectRootProps={{ disabled: cantonDisabled }}
        />

        <InputField
          fieldType="select"
          label="Distrito"
          name="distrito"
          disableSelectPortal
          required
          placeholder={loadingDistritos ? "Cargando..." : "Seleccione una opción"}
          options={distritoOptions}
          rules={{ required: "El campo es obligatorio", setValueAs: (v) => String(v ?? "").trim() }}
          selectRootProps={{ disabled: distritoDisabled }}
        />
      </SimpleGrid>

      <InputField
        fieldType="text"
        label="Otras señas"
        name="otros_datos"
        required
        rules={{ required: "El campo es obligatorio" }}
      />
    </>
  );
}
