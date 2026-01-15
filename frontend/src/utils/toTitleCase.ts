export const toTitleCase = (s: string) =>
  s
    .toLocaleLowerCase("es")
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toLocaleUpperCase("es") +
        word.slice(1)
    )
    .join(" ");
