export const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      [
        "button",
        "a",
        "input",
        "select",
        "textarea",
        "[role='button']",
        "[role='link']",
        "[role='checkbox']",
        "[data-prevent-row-select='true']",
      ].join(","),
    ),
  );
};
