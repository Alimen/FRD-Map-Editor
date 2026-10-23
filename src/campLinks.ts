import { CampLink, HexCell } from "./types";

export const isLinkEndpoint = (cell: HexCell | undefined): cell is HexCell =>
  Boolean(cell && Number.isInteger(cell.q) && Number.isInteger(cell.r));

/** Validate both imported links and links after editing/removing map cells. */
export const normalizeCampLinks = (value: unknown, cells: Record<string, HexCell>): CampLink[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((link) => {
    if (!link || typeof link.from !== "string" || typeof link.to !== "string" ||
      link.from === link.to || !isLinkEndpoint(cells[link.from]) || !isLinkEndpoint(cells[link.to])) return [];
    const key = JSON.stringify([link.from, link.to]);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ from: link.from, to: link.to }];
  });
};
