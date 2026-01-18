import { useEffect, useMemo, useState, useCallback } from "react";
import { SimpleGrid, Heading } from "@chakra-ui/react";
import { InputField } from "../../../../components/forms";
import { useFormContext, useWatch } from "react-hook-form";
import type { Canton, Distrito, Provincia } from "../../../../types/Address";
import { toTitleCase } from "../../../../utils";
import { getCantonesPorProvincia, getDistritosPorCanton } from "../../../../services/api/employees";

type SelectOption = { label: string; value: string };

export function DireccionFields({ provincias }: { provincias: Provincia[] }) {
  const { setValue } = useFormContext();

  // valores seleccionados en el form
  const provinciaNombre = useWatch({ name: "provincia" }) as string;
  const cantonNombre = useWatch({ name: "canton" }) as string;

  const [cantones, setCantones] = useState<Canton[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [loadingCantones, setLoadingCantones] = useState(false);
  const [loadingDistritos, setLoadingDistritos] = useState(false);

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

  // Cuando cambia provincia → reset cantón/distrito y cargar cantones
  useEffect(() => {
    const run = async () => {
      // reset dependientes
      setCantones([]);
      setDistritos([]);
      setValue("canton", "");
      setValue("distrito", "");

      if (!provinciaNombre) return;

      const provinciaId = findProvinciaIdByNombre(provinciaNombre);
      if (!provinciaId) return;

      setLoadingCantones(true);
      try {
        const resp = await getCantonesPorProvincia(provinciaId);
        const cantones = resp.data.data.cantones;
        setCantones(cantones);
      } finally {
        setLoadingCantones(false);
      }
    };

    run();
  }, [provinciaNombre, findProvinciaIdByNombre, setValue]);

  // Cuando cambia cantón → reset distrito y cargar distritos
  useEffect(() => {
    const run = async () => {
      setDistritos([]);
      setValue("distrito", "");

      if (!cantonNombre) return;

      const cantonId = findCantonIdByNombre(cantonNombre);
      if (!cantonId) return;

      setLoadingDistritos(true);
      try {
        const resp = await getDistritosPorCanton(cantonId);
        const distritos = resp.data.data.distritos;
        setDistritos(distritos);
      } finally {
        setLoadingDistritos(false);
      }
    };

    run();
  }, [cantonNombre, findCantonIdByNombre, setValue]);

  const cantonDisabled = !provinciaNombre || loadingCantones || cantones.length === 0;
  const distritoDisabled = !cantonNombre || loadingDistritos || distritos.length === 0;

  return (
    <>
      <Heading as="h3" size="md">Dirección</Heading>

      <SimpleGrid columns={{ base: 2, md: 3 }} gap={2}>
        <InputField
          fieldType="select"
          label="Provincia"
          name="provincia"
          disableSelectPortal
          required
          placeholder={provincias.length ? "Seleccione una opción" : "Cargando..."}
          options={provinciaOptions}
          rules={{ required: "El campo es obligatorio", setValueAs: (v) => String(v ?? "").trim(), }}
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
          rules={{ required: "El campo es obligatorio", setValueAs: (v) => String(v ?? "").trim(), }}
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
          rules={{ required: "El campo es obligatorio", setValueAs: (v) => String(v ?? "").trim(), }}
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
