import { rangesOverlap } from "../dateRange.js";
import { findDateRangeConflicts } from "../conflicts.js";

describe("dateRange overlap (DATEONLY)", () => {
  test("No overlap cuando termina un día antes", () => {
    expect(
      rangesOverlap({
        aStart: "2026-01-10",
        aEnd: "2026-01-12",
        bStart: "2026-01-13",
        bEnd: "2026-01-15",
      })
    ).toBe(false);
  });

  test("Overlap cuando comparten un día (inclusivo)", () => {
    expect(
      rangesOverlap({
        aStart: "2026-01-10",
        aEnd: "2026-01-12",
        bStart: "2026-01-12",
        bEnd: "2026-01-15",
      })
    ).toBe(true);
  });

  test("Overlap cuando uno contiene al otro", () => {
    expect(
      rangesOverlap({
        aStart: "2026-01-10",
        aEnd: "2026-01-20",
        bStart: "2026-01-12",
        bEnd: "2026-01-15",
      })
    ).toBe(true);
  });
});

describe("findDateRangeConflicts", () => {
  test("Detecta conflicto contra vacaciones e incapacidad", () => {
    const existingBlocks = [
      { kind: "VACATION", id: 1, startDate: "2026-01-10", endDate: "2026-01-12", status: 2 },
      { kind: "SICKNESS", id: 9, startDate: "2026-01-20", endDate: "2026-01-22", status: 2 },
    ];

    const res = findDateRangeConflicts({
      newKind: "LEAVE",
      newStartDate: "2026-01-12",
      newEndDate: "2026-01-21",
      existingBlocks,
    });

    expect(res.hasConflicts).toBe(true);
    expect(res.conflicts.length).toBe(2);

    const kinds = res.conflicts.map((c) => c.withKind).sort();
    expect(kinds).toEqual(["SICKNESS", "VACATION"]);
  });

  test("Sin conflicto retorna empty", () => {
    const existingBlocks = [
      { kind: "VACATION", id: 1, startDate: "2026-01-10", endDate: "2026-01-12" },
    ];

    const res = findDateRangeConflicts({
      newKind: "LEAVE",
      newStartDate: "2026-01-13",
      newEndDate: "2026-01-13",
      existingBlocks,
    });

    expect(res.hasConflicts).toBe(false);
    expect(res.conflicts).toEqual([]);
  });
});
