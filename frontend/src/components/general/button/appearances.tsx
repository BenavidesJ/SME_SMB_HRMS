import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react";

export const appearances = {
  primary: {
    color: "white",
    fontWeight: "bold",
    backgroundColor: "brand.blue.100",
    _hover: { bg: "blue.600" },
  },
  login: {
    color: "white",
    fontWeight: "bold",
    backgroundColor: "brand.blue.100",
    _hover: { bg: "blue.600" },
  },

  secondary: {
    color: "brand.blue.100",
    bg: "transparent",
    fontWeight: "bold",
    border: "1px solid",
    backgroundColor: "red",
    borderColor: "brand.blue.100",
    _hover: { bg: "brand.blue.50" },
  },

  danger: {
    color: "white",
    bg: "semantic.danger",
    fontWeight: "bold",
    backgroundColor: "red",
    _hover: { bg: "red.600" },
  },
} satisfies Record<string, ChakraButtonProps>;

export type ButtonAppearance = keyof typeof appearances;