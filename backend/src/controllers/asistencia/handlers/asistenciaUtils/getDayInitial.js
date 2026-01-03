import dayjs from "dayjs";

export function getDayInitial(dateObj) {
  // JS: 0=Sunday ... 6=Saturday
  const d = dayjs(dateObj).day();

  // 0 Domingo, 1 Lunes, 2 Martes, 3 Miércoles, 4 Jueves, 5 Viernes, 6 Sábado
  switch (d) {
    case 1:
      return "L";
    case 2:
      return "M";
    case 3:
      return "K";
    case 4:
      return "J";
    case 5:
      return "V";
    case 6:
      return "S";
    case 0:
    default:
      return "D";
  }
}