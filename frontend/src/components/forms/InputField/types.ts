import type { ReactNode } from "react";
import type {
  InputProps,
  NumberInputRootProps,
  SelectRootProps,
} from "@chakra-ui/react";
import type { RegisterOptions } from "react-hook-form";

/**
 * Variantes de campo soportadas por InputField.
 */
export type FieldType =
  | "text"
  | "password"
  | "email"
  | "number"
  | "select"
  | "date"
  | "month"
  | "year"
  | "time";

/**
 * Modelo de opción usado por la variante select.
 */
export type SelectOption = {
  /** Texto mostrado en la lista de opciones. */
  label: string;
  /** Valor enviado por react-hook-form. */
  value: string | number;
  /** Deshabilita la opción cuando es true. */
  disabled?: boolean;
};

/**
 * Contrato público de props del componente InputField.
 */
export interface FieldProps extends InputProps {
  /** Variante de campo a renderizar. Por defecto es "text". */
  fieldType: FieldType;
  /** Etiqueta mostrada encima del control. */
  label?: string;
  /** Nombre del campo en React Hook Form. */
  name: string;
  /** Placeholder mostrado cuando el campo está vacío. */
  placeholder?: string;
  /** Texto de ayuda mostrado debajo del campo cuando no hay error. */
  helperText?: ReactNode | string;
  /** Marca el campo como requerido en UI y validación. */
  required?: boolean;
  /** Oculta el indicador requerido/opcional cuando es true. */
  noIndicator?: boolean;
  /** Reglas adicionales de validación para register/controller de React Hook Form. */
  rules?: RegisterOptions;
  /** Adorno opcional al inicio para campos de texto. */
  startElement?: ReactNode;
  /** Adorno opcional al final para campos de texto. */
  endElement?: ReactNode;
  /** Permite solo dígitos en entradas de texto cuando es true. */
  numericOnly?: boolean;
  /** Permite solo caracteres de texto en entradas de texto cuando es true. */
  textOnly?: boolean;
  /** Permite guion cuando textOnly es true. */
  allowHyphen?: boolean;
  /** Cantidad máxima de dígitos cuando numericOnly es true. */
  maxDigits?: number;
  /** Habilita máscara monetaria decimal para entradas de texto. */
  currencyMask?: boolean;
  /** Cantidad máxima de decimales usada por la máscara monetaria. */
  currencyMaxDecimals?: number;

  /**
   * Props extra enviados a NumberInput.Root.
   * name, value, onValueChange y disabled se controlan internamente.
   */
  numberProps?: Omit<
    NumberInputRootProps,
    "name" | "value" | "onValueChange" | "disabled"
  >;

  /** Opciones para fieldType="select". */
  options?: SelectOption[];
  /**
   * Props extra enviados a Select.Root.
   * collection, value, onValueChange y name se controlan internamente.
   */
  selectRootProps?: Omit<
    SelectRootProps,
    "collection" | "value" | "onValueChange" | "name"
  >;
  /** Muestra el botón para limpiar en select cuando es true. */
  clearable?: boolean;
  /** Renderiza el contenido del select sin Portal cuando es true. */
  disableSelectPortal?: boolean;
}
