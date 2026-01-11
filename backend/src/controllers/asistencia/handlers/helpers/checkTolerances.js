export function round2(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
}

export function isAfterWithTolerance(now, expected, toleranceMin) {
  // now > expected + tolerance
  return now.isAfter(expected.add(toleranceMin, "minute"));
}

export function isBeforeWithTolerance(now, expected, toleranceMin) {
  // now < expected - tolerance
  return now.isBefore(expected.subtract(toleranceMin, "minute"));
}