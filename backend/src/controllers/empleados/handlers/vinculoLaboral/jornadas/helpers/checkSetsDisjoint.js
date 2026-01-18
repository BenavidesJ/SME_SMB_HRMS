export const setsAreDisjoint = (a, b) => {
  const A = new Set(a.split(""));
  for (const ch of b.split("")) if (A.has(ch)) return false;
  return true;
};