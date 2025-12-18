import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          blue: {
            25: { value: "var(--brand-blue-25)" },
            50: { value: "var(--brand-blue-50)" },
            75: { value: "var(--brand-blue-75)" },
            100:{ value: "var(--brand-blue-100)" },
            600:{ value: "var(--dark-blue-100)" },
          },
          green: {
            25: { value: "var(--brand-green-25)" },
            50: { value: "var(--brand-green-50)" },
            75: { value: "var(--brand-green-75)" },
            100:{ value: "var(--brand-green-100)" },
          },
          text: { value: "var(--text)"},
        },
        semantic: {
          danger: {value: "var(--danger)"}
        }
      },
    },
  },
});
