export function isNumericLike(v: string) {
  return /^[0-9]+$/.test(v);
}

export function titleFromSegment(seg: string) {
  const clean = decodeURIComponent(seg);
  const spaced = clean.replace(/[-_]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}




