export const stickyCss = {
  "& [data-sticky]": {
    position: "sticky",
    zIndex: 1,
    bg: "bg",
  },

  "& [data-sticky=end]": {
    shadow: "inset 8px 0px 8px -8px rgba(0, 0, 0, 0.16)",
  },

  "& [data-sticky=start]": {
    shadow: "inset -8px 0px 8px -8px rgba(0, 0, 0, 0.16)",
  },

  "& thead tr": {
    shadow: "0 1px 0 0 {colors.border}",
    "&:has(th[data-sticky])": {
      zIndex: 2,
    },
  },
} as const;