import {
  parseToTz,
  toDayIndex,
  toMinuteOfDay,
  toDateStr,
  splitByMidnight,
} from "../timeAdapter.js";

describe("timeAdapter.dayjs (ESM)", () => {
  const TZ = "America/Costa_Rica";

  test("parseToTz interpreta string sin offset como hora local", () => {
    const d = parseToTz("2026-01-19 10:00:00", TZ);
    expect(d.format("YYYY-MM-DD HH:mm")).toBe("2026-01-19 10:00");
  });

  test("toMinuteOfDay funciona con string sin offset", () => {
    expect(toMinuteOfDay("2026-01-19 08:30:00", TZ)).toBe(8 * 60 + 30);
  });

  test("toDayIndex: 2026-01-19 es lunes (0)", () => {
    expect(toDayIndex("2026-01-19 10:00:00", TZ)).toBe(0);
  });

  test("toDateStr obtiene YYYY-MM-DD", () => {
    expect(toDateStr("2026-01-19 10:00:00", TZ)).toBe("2026-01-19");
  });

  test("splitByMidnight parte un intervalo que cruza medianoche", () => {
    const parts = splitByMidnight(
      "2026-01-19 23:00:00",
      "2026-01-20 01:00:00",
      TZ
    );

    expect(parts).toEqual([
      { dateStr: "2026-01-19", dayIndex: 0, startMin: 23 * 60, endMin: 1440 },
      { dateStr: "2026-01-20", dayIndex: 1, startMin: 0, endMin: 60 },
    ]);
  });
});
