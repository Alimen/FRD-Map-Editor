import React from "react";
import { CampLink, HexCell } from "../types";
import { axialToPixel } from "../hexLayout";
import { isLinkEndpoint } from "../campLinks";

interface Props {
  cells: Record<string, HexCell>;
  links: CampLink[];
  size: number;
  start: string | null;
  hover: string | null;
  canRemove: boolean;
  onDelete: (link: CampLink) => void;
}

export const CampLinksOverlay: React.FC<Props> = ({ cells, links, size, start, hover, canRemove, onDelete }) => {
  const pathFor = (link: CampLink) => {
    const from = cells[link.from];
    const to = cells[link.to];
    if (!from || !to || link.from === link.to) return null;
    const a = axialToPixel(from.q, from.r, size);
    const b = axialToPixel(to.q, to.r, size);
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / distance;
    const uy = (b.y - a.y) / distance;
    // Opposing edges bend to opposite sides so both directions stay visible.
    const bend = links.some((other) => other.from === link.to && other.to === link.from) ? size * 0.65 : 0;
    const cx = (a.x + b.x) / 2 - uy * bend;
    const cy = (a.y + b.y) / 2 + ux * bend;
    const startAngle = Math.atan2(cy - a.y, cx - a.x);
    const endAngle = Math.atan2(b.y - cy, b.x - cx);
    return `M ${a.x + Math.cos(startAngle) * size * 0.48} ${a.y + Math.sin(startAngle) * size * 0.48} Q ${cx} ${cy} ${b.x - Math.cos(endAngle) * size * 0.56} ${b.y - Math.sin(endAngle) * size * 0.56}`;
  };
  const preview = start && hover ? pathFor({ from: start, to: hover }) : null;

  return (
    <g id="camp-links-overlay">
      <defs>
        <marker id="camp-link-arrow" viewBox="-1 -1 12 12" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        </marker>
      </defs>
      {(Object.entries(cells) as [string, HexCell][]).filter(([key, cell]) =>
        (key === start || key === hover) && isLinkEndpoint(cell)).map(([key, cell]) => {
        const center = axialToPixel(cell.q, cell.r, size);
        return <circle key={key} cx={center.x} cy={center.y} r={size * 0.43}
          fill={key === start ? "#fbbf2433" : "none"} stroke={key === start ? "#fbbf24" : "#fbbf2477"}
          strokeWidth={key === start ? 3 : 1.5} pointerEvents="none" />;
      })}
      {links.map((link) => {
        const d = pathFor(link);
        if (!d) return null;
        return (
          <g key={JSON.stringify([link.from, link.to])} className={canRemove ? "cursor-pointer" : undefined}
            onMouseDown={(event) => {
              if (canRemove && event.button === 0) { event.stopPropagation(); event.preventDefault(); }
            }}>
            {canRemove && <path d={d} fill="none" stroke="transparent" strokeWidth={16} pointerEvents="stroke"
              role="button" tabIndex={0} aria-label={`刪除連線 ${link.from} → ${link.to}`}
              onClick={(event) => {
                if (event.button === 0) { event.stopPropagation(); onDelete(link); }
              }}
              onKeyDown={(event) => {
                if (["Enter", " ", "Delete", "Backspace"].includes(event.key)) {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete(link);
                }
              }}>
              <title>{`${link.from} → ${link.to}（點擊刪除）`}</title>
            </path>}
            <path d={d} fill="none" stroke="#0f172a" strokeWidth={6} pointerEvents="none" />
            <path d={d} fill="none" stroke="#fbbf24" strokeWidth={3} markerEnd="url(#camp-link-arrow)" pointerEvents="none" />
          </g>
        );
      })}
      {preview && <path d={preview} fill="none" stroke="#fbbf24" strokeWidth={3} strokeDasharray="6 4"
        markerEnd="url(#camp-link-arrow)" opacity={0.8} pointerEvents="none" />}
    </g>
  );
};
