import type { NavIndex } from "./buildNavIndex";

const isLikelyId = (seg: string) => /^[0-9]+$/.test(seg) || seg.length >= 8;

export type Crumb = { label: string; to?: string; isCurrent?: boolean };

export const resolveBreadcrumb = (pathname: string, index: NavIndex): Crumb[] => {
  if (pathname === "/") return [{ label: "Inicio", isCurrent: true }];

  if (index.byPath[pathname]) {
    const chain: string[] = [];
    let p: string | undefined = pathname;
    while (p) {
      chain.push(p);
      p = index.parentOf[p];
    }
    chain.reverse();

    const crumbs: Crumb[] = [{ label: "Inicio", to: "/" }];
    for (let i = 0; i < chain.length; i++) {
      const path = chain[i];
      const isLast = i === chain.length - 1;
      crumbs.push({
        label: index.byPath[path].label,
        to: isLast ? undefined : path,
        isCurrent: isLast,
      });
    }
    return crumbs;
  }

  const bestParent = index.allPathsSortedDesc.find(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  const crumbs: Crumb[] = [{ label: "Inicio", to: "/" }];

  if (bestParent) {
    const chain: string[] = [];
    let p: string | undefined = bestParent;
    while (p) {
      chain.push(p);
      p = index.parentOf[p];
    }
    chain.reverse();

    for (let i = 0; i < chain.length; i++) {
      const path = chain[i];
      crumbs.push({
        label: index.byPath[path].label,
        to: path,
      });
    }
  }

  const lastSeg = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const detailLabel = isLikelyId(lastSeg) ? `Detalle (${lastSeg.slice(0, 8)})` : "Detalle";

  crumbs.push({ label: detailLabel, isCurrent: true });

  return crumbs;
};
