import { Box, SimpleGrid } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { InputField } from "../../../../../components/forms";
import { Button } from "../../../../../components/general/button/Button";
import { DireccionFields } from "../components/CamposDireccion";
import type { SelectOption } from "../../../../../components/forms/InputField";
import type { Provincia } from "../../../../../types/Address";
import { getMaxBirthDateForLegalAge } from "../../../../../utils";

const IDENTIFICATION_MAX_DIGITS = 12;
const PHONE_MAX_DIGITS = 15;

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  marStatsOptions: SelectOption[];
  rolesOptions: SelectOption[];
  provincias: Provincia[];
  maritalStatusesLoaded: boolean;
  rolesLoaded: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  disableSubmit?: boolean;
};

export function Formularios({
  mode,

  marStatsOptions,
  rolesOptions,

  provincias,
  maritalStatusesLoaded,
  rolesLoaded,

  isSubmitting = false,
  submitLabel,
  disableSubmit = false,
}: Props) {
  const isCreate = mode === "create";

  const finalSubmitLabel =
    submitLabel ?? (isCreate ? "Agregar Colaborador" : "Actualizar");

  const dateHelper = "Formato día/mes/año";
  const maxBirthDate = getMaxBirthDateForLegalAge();

  return (
    <>
      <SimpleGrid columns={{ base: 2, md: 3 }} gapX="1.25rem">
        <InputField
          fieldType="text"
          label="Nombre"
          name="nombre"
          required
          textOnly
          rules={{
            required: "El campo es obligatorio",
            maxLength: { value: 25, message: "El máximo son 25 caracteres" },
            pattern: {
              value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
              message: "Solo se permiten letras y espacios",
            },
            setValueAs: (v) => String(v ?? "").trim(),
          }}
        />

        <InputField
          fieldType="text"
          label="Primer Apellido"
          name="primer_apellido"
          required
          textOnly
          rules={{
            required: "El campo es obligatorio",
            maxLength: { value: 20, message: "El máximo son 20 caracteres" },
            pattern: {
              value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
              message: "Solo se permiten letras y espacios",
            },
            setValueAs: (v) => String(v ?? "").trim(),
          }}
        />

        <InputField
          fieldType="text"
          label="Segundo Apellido"
          name="segundo_apellido"
          required
          textOnly
          rules={{
            required: "El campo es obligatorio",
            maxLength: { value: 20, message: "El máximo son 20 caracteres" },
            pattern: {
              value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
              message: "Solo se permiten letras y espacios",
            },
            setValueAs: (v) => String(v ?? "").trim(),
          }}
        />

        <InputField
          fieldType="text"
          label="Cédula o DIMEX"
          name="identificacion"
          required
          numericOnly
          maxDigits={IDENTIFICATION_MAX_DIGITS}
          rules={{
            required: "El campo es obligatorio",
            pattern: { value: /^\d+$/, message: "Solo se permiten números." },
            maxLength: { value: IDENTIFICATION_MAX_DIGITS, message: "El máximo son 12 dígitos" },
            setValueAs: (v) => String(v ?? "").trim(),
          }}
        />

        <InputField
          fieldType="email"
          label="Correo Electrónico"
          name="correo_electronico"
          required
          rules={{
            required: "El campo es obligatorio",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
              message: "Formato de correo electrónico inválido",
            },
            setValueAs: (v) => String(v ?? "").trim(),
          }}
        />

        <InputField
          fieldType="text"
          label="Teléfono"
          name="telefono"
          required
          numericOnly
          maxDigits={PHONE_MAX_DIGITS}
          rules={{
            required: "El campo es obligatorio",
            pattern: { value: /^\d+$/, message: "Solo se permiten números" },
            minLength: { value: 8, message: "Debe tener al menos 8 dígitos" },
            maxLength: { value: PHONE_MAX_DIGITS, message: "No puede exceder 15 dígitos" },
            setValueAs: (v) => String(v ?? "").trim(),
          }}
        />

        <InputField
          fieldType="date"
          label="Fecha de Nacimiento"
          name="fecha_nacimiento"
          helperText={dateHelper}
          required
          max={maxBirthDate}
          rules={{
            required: "El campo es obligatorio",
            validate: (value) => {
              if (!value) return true;
              return value <= maxBirthDate || "La persona debe ser mayor o igual a 18 años";
            },
          }}
        />

        <InputField
          fieldType="select"
          label="Estado Civil"
          name="estado_civil"
          disableSelectPortal
          required
          placeholder={
            maritalStatusesLoaded ? "Seleccione una opción" : "Cargando..."
          }
          options={marStatsOptions}
          rules={{
            required: "El campo es obligatorio",
            setValueAs: (v) => String(v ?? "").trim(),
          }}
          selectRootProps={{ disabled: !maritalStatusesLoaded }}
        />

        <InputField
          fieldType="select"
          label="Rol"
          name="rol"
          required
          disableSelectPortal
          placeholder={rolesLoaded ? "Seleccione una opción" : "Cargando..."}
          options={rolesOptions}
          rules={{
            required: "El campo es obligatorio",
            setValueAs: (v) => String(v ?? "").trim(),
          }}
          selectRootProps={{ disabled: !rolesLoaded }}
        />

        <InputField
          fieldType="number"
          label="Cantidad de Hijos"
          name="cantidad_hijos"
          required
          rules={{ required: "El campo es obligatorio" }}
          defaultValue={0}
        />
      </SimpleGrid>

      <DireccionFields provincias={provincias} mode={isCreate ? undefined : "edit"} />

      <Box w="250px" alignContent="center">
        <Button
          loading={isSubmitting}
          loadingText={isCreate ? "Agregando" : "Actualizando"}
          appearance="login"
          type="submit"
          mt="4"
          size="lg"
          w="100%"
          marginBottom="5"
          disabled={disableSubmit}
        >
          {finalSubmitLabel} {isCreate ? <FiPlus /> : null}
        </Button>
      </Box>
    </>
  );
}
