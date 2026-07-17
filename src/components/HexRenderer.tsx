/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from "react";
import { HexCell, TerrainType, LandmarkType, StyleVariant } from "../types";
import { TERRAIN_CONFIGS, STYLE_CONFIGS } from "../constants";
import { axialToPixel } from "../hexLayout";
import { getTravelEventColor } from "../travelEventColors";

const campLandmarks = new Set<LandmarkType>([
  LandmarkType.MAIN_CAMP,
  LandmarkType.SUB_CAMP,
]);

interface HexRendererProps {
  cell: HexCell;
  size: number;
  isSelected?: boolean;
  travelEvent?: string;
  campTag?: string;
}

const HexRendererComponent: React.FC<HexRendererProps> = ({
  cell,
  size,
  isSelected,
  travelEvent,
  campTag,
}) => {
  const { q, r, terrain, landmark, style } = cell;

  // Calculate center coordinates with the axial r axis running SW-NE.
  const { x: cx, y: cy } = axialToPixel(q, r, size);

  // Configuration values
  const tConfig = TERRAIN_CONFIGS[terrain] || TERRAIN_CONFIGS[TerrainType.PLAIN];
  const sConfig = STYLE_CONFIGS[style] || STYLE_CONFIGS[StyleVariant.NORMAL];
  const hasTerrain = terrain !== TerrainType.NONE;

  // Hexagon point calculations
  const angles = [
    Math.PI / 6,
    Math.PI / 2,
    (5 * Math.PI) / 6,
    (7 * Math.PI) / 6,
    (3 * Math.PI) / 2,
    (11 * Math.PI) / 6,
  ];

  const pointsStr = angles
    .map((a) => {
      const px = cx + size * Math.cos(a);
      const py = cy + size * Math.sin(a);
      return `${px},${py}`;
    })
    .join(" ");

  // Custom high fidelity visual renderings for Landmarks
  const renderLandmarks = () => {
    switch (landmark) {
      case LandmarkType.MAIN_DUNGEON:
        return (
          <g filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))">
            {/* Large Dungeon Castle / Keep */}
            {/* Base platform */}
            <rect x={cx - size * 0.4} y={cy} width={size * 0.8} height={size * 0.35} rx="2" fill="#4b5563" stroke="#1f2937" strokeWidth="1.5" />
            
            {/* Left Tower */}
            <rect x={cx - size * 0.4} y={cy - size * 0.3} width={size * 0.22} height={size * 0.45} rx="1" fill="#374151" stroke="#1f2937" strokeWidth="1.5" />
            <polygon points={`${cx - size * 0.43},${cy - size * 0.3} ${cx - size * 0.29},${cy - size * 0.5} ${cx - size * 0.15},${cy - size * 0.3}`} fill="#991b1b" stroke="#1f2937" strokeWidth="1.2" />
            <rect x={cx - size * 0.33} y={cy - size * 0.15} width={size * 0.08} height={size * 0.15} rx="1" fill="#f3f4f6" opacity="0.6" />

            {/* Right Tower */}
            <rect x={cx + size * 0.18} y={cy - size * 0.3} width={size * 0.22} height={size * 0.45} rx="1" fill="#374151" stroke="#1f2937" strokeWidth="1.5" />
            <polygon points={`${cx + size * 0.15},${cy - size * 0.3} ${cx + size * 0.29},${cy - size * 0.5} ${cx + size * 0.43},${cy - size * 0.3}`} fill="#991b1b" stroke="#1f2937" strokeWidth="1.2" />
            <rect x={cx + size * 0.25} y={cy - size * 0.15} width={size * 0.08} height={size * 0.15} rx="1" fill="#f3f4f6" opacity="0.6" />

            {/* Center Hall with battlements */}
            <rect x={cx - size * 0.18} y={cy - size * 0.1} width={size * 0.36} height={size * 0.25} fill="#4b5563" stroke="#1f2937" strokeWidth="1.5" />
            <path d={`M ${cx - size * 0.18},${cy - size * 0.1} h ${size * 0.06} v ${size * 0.05} h ${size * 0.06} v -${size * 0.05} h ${size * 0.06} v ${size * 0.05} h ${size * 0.06} v -${size * 0.05} h ${size * 0.06} v ${size * 0.05} h ${size * 0.06} v -${size * 0.05}`} fill="none" stroke="#1f2937" strokeWidth="1.5" />

            {/* Dark Demonic Dungeon Archway Entrance */}
            <path d={`M ${cx - size * 0.1},${cy + size * 0.35} A ${size * 0.1},${size * 0.15} 0 0 1 ${cx + size * 0.1},${cy + size * 0.35} Z`} fill="#111827" stroke="#1f2937" strokeWidth="1" />
            {/* Glowing crystal on top of gate */}
            <circle cx={cx} cy={cy - size * 0.15} r="3" fill="#f59e0b" filter="drop-shadow(0 0 2px #f59e0b)" />
          </g>
        );
      case LandmarkType.SUB_DUNGEON:
        return (
          <g filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.4))">
            {/* Small Dungeon Tower / Ruin Crypt */}
            <rect x={cx - size * 0.18} y={cy - size * 0.25} width={size * 0.36} height={size * 0.55} rx="2" fill="#52525b" stroke="#27272a" strokeWidth="1.5" />
            {/* Conic roof */}
            <polygon points={`${cx - size * 0.24},${cy - size * 0.25} ${cx},${cy - size * 0.5} ${cx + size * 0.24},${cy - size * 0.25}`} fill="#1e3a8a" stroke="#27272a" strokeWidth="1.5" />
            {/* Spooky arched entry */}
            <path d={`M ${cx - size * 0.07},${cy + size * 0.3} A ${size * 0.07},${size * 0.12} 0 0 1 ${cx + size * 0.07},${cy + size * 0.3} Z`} fill="#09090b" stroke="#27272a" strokeWidth="1" />
            {/* Ruin brick details */}
            <line x1={cx - size * 0.1} y1={cy - size * 0.1} x2={cx} y2={cy - size * 0.1} stroke="#3f3f46" strokeWidth="1" />
            <line x1={cx} y1={cy + size * 0.1} x2={cx + size * 0.1} y2={cy + size * 0.1} stroke="#3f3f46" strokeWidth="1" />
            {/* Spooky torch glow */}
            <circle cx={cx - size * 0.12} cy={cy + size * 0.05} r="2" fill="#ef4444" />
          </g>
        );
      case LandmarkType.MAIN_CAMP:
        return (
          <g filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.3))">
            {/* Large War Camp / Royal Pavilion Tent */}
            {/* Main Tent Body */}
            <polygon points={`${cx - size * 0.4},${cy + size * 0.3} ${cx},${cy - size * 0.35} ${cx + size * 0.4},${cy + size * 0.3}`} fill="#b91c1c" stroke="#450a0a" strokeWidth="1.5" />
            {/* Left flap */}
            <polygon points={`${cx - size * 0.4},${cy + size * 0.3} ${cx - size * 0.05},${cy + size * 0.3} ${cx},${cy - size * 0.35}`} fill="#991b1b" stroke="#450a0a" strokeWidth="1" />
            {/* Right flap */}
            <polygon points={`${cx + size * 0.4},${cy + size * 0.3} ${cx + size * 0.05},${cy + size * 0.3} ${cx},${cy - size * 0.35}`} fill="#991b1b" stroke="#450a0a" strokeWidth="1" />
            
            {/* Outpost banners & spear poles */}
            <line x1={cx - size * 0.45} y1={cy + size * 0.3} x2={cx - size * 0.45} y2={cy - size * 0.3} stroke="#5c2d12" strokeWidth="1.8" />
            <polygon points={`${cx - size * 0.45},${cy - size * 0.3} ${cx - size * 0.65},${cy - size*0.2} ${cx - size*0.45},${cy - size*0.1}`} fill="#f59e0b" stroke="#450a0a" strokeWidth="1" />

            <line x1={cx + size * 0.45} y1={cy + size * 0.3} x2={cx + size * 0.45} y2={cy - size * 0.3} stroke="#5c2d12" strokeWidth="1.8" />
            <polygon points={`${cx + size * 0.45},${cy - size * 0.3} ${cx + size * 0.65},${cy - size*0.2} ${cx + size*0.45},${cy - size*0.1}`} fill="#f59e0b" stroke="#450a0a" strokeWidth="1" />

            {/* Inner opening */}
            <polygon points={`${cx - size * 0.1},${cy + size * 0.3} ${cx},${cy} ${cx + size * 0.1},${cy + size * 0.3}`} fill="#450a0a" />
          </g>
        );
      case LandmarkType.SUB_CAMP:
        return (
          <g filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.3))">
            {/* Small Campfire and Tent */}
            {/* Small simple tent */}
            <polygon points={`${cx - size * 0.45},${cy + size * 0.15} ${cx - size * 0.1},${cy - size * 0.25} ${cx + size * 0.25},${cy + size * 0.15}`} fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1.3" />
            <polygon points={`${cx - size * 0.3},${cy + size * 0.15} ${cx - size * 0.1},${cy - size * 0.25} ${cx + size * 0.1},${cy + size * 0.15}`} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1" />
            {/* Entrance of simple tent */}
            <polygon points={`${cx - size * 0.2},${cy + size * 0.15} ${cx - size * 0.1},${cy - size * 0.05} ${cx},${cy + size * 0.15}`} fill="#172554" />

            {/* Campfire layout */}
            <g transform={`translate(${size * 0.22}, ${size * 0.22})`}>
              {/* Crossed campfire logs */}
              <line x1={cx - 6} y1={cy + 4} x2={cx + 6} y2={cy - 4} stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
              <line x1={cx - 6} y1={cy - 4} x2={cx + 6} y2={cy + 4} stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
              {/* Flame spark */}
              <path d={`M ${cx},${cy - 6} Q ${cx - 4},${cy + 2} ${cx},${cy + 4} Q ${cx + 4},${cy + 2} ${cx},${cy - 6}`} fill="#f97316" filter="drop-shadow(0px 0px 2px #ef4444)" />
              <path d={`M ${cx},${cy - 3} Q ${cx - 2},${cy + 2} ${cx},${cy + 3} Q ${cx + 2},${cy + 2} ${cx},${cy - 3}`} fill="#fbbf24" />
            </g>
          </g>
        );
      case LandmarkType.NONE:
      default:
        return null;
    }
  };

  // Determine standard hex styling
  const fillColor = hasTerrain ? tConfig.color : "transparent";
  const strokeColor = isSelected ? "#3b82f6" : sConfig.borderColor || tConfig.borderColor;
  const strokeWidth = isSelected ? 3.5 : 1.2;
  const hasStyleMarker = style !== StyleVariant.NORMAL;
  const styleRingRadius = size * 0.78;
  const styleRingDash = `${Math.max(3, size * 0.09)} ${Math.max(2, size * 0.06)}`;
  const eventMarkerX = cx + size * 0.42;
  const eventMarkerY = cy - size * 0.46;
  const eventColor = travelEvent ? getTravelEventColor(travelEvent) : null;
  const campTagLabel = campTag?.trim() ?? "";
  const visibleCampTag = campTagLabel;
  const campTagColor = visibleCampTag ? getTravelEventColor(visibleCampTag) : null;
  const campTagMarkerX = cx - size * 0.42;
  const campTagMarkerY = cy - size * 0.46;
  const campTagFontSize = Math.max(6, Math.min(10, size * 0.15));
  const campTagHorizontalPadding = Math.max(8, size * 0.16);
  const campTagBadgeWidth = Math.max(
    24,
    Math.min(size * 1.45, visibleCampTag.length * campTagFontSize * 0.66 + campTagHorizontalPadding * 2)
  );
  const campTagBadgeHeight = Math.max(14, size * 0.3);
  const campTagTextWidth = campTagBadgeWidth - campTagHorizontalPadding;
  const shouldCompressCampTagText = visibleCampTag.length * campTagFontSize * 0.66 > campTagTextWidth;

  return (
    <g
      id={`hex-g-${q}-${r}`}
      className="cursor-pointer transition-all duration-150 select-none"
    >
      {/* Primary Hexagon Surface */}
      <polygon
        id={`hex-polygon-${q}-${r}`}
        points={pointsStr}
        fill={fillColor}
        stroke={hasTerrain ? strokeColor : "transparent"}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        className="transition-colors duration-200"
      />

      {/* Style layer marker: a dashed inner ring that stays clear of center landmarks. */}
      {hasTerrain && hasStyleMarker && (
        <circle
          cx={cx}
          cy={cy}
          r={styleRingRadius}
          fill="none"
          stroke={sConfig.borderColor}
          strokeWidth={Math.max(1.1, size * 0.032)}
          strokeDasharray={styleRingDash}
          strokeLinecap="round"
          opacity={0.86}
          className="pointer-events-none"
        />
      )}

      {/* Main interactive/gorgeous landmark (castle, tower, camp) */}
      {hasTerrain && renderLandmarks()}

      {hasTerrain && travelEvent && eventColor && (
        <g className="pointer-events-none" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.32))">
          <circle
            cx={eventMarkerX}
            cy={eventMarkerY}
            r={Math.max(7, size * 0.19)}
            fill={eventColor.fill}
            stroke={eventColor.stroke}
            strokeWidth={Math.max(1, size * 0.035)}
          />
          <text
            x={eventMarkerX}
            y={eventMarkerY + Math.max(3, size * 0.075)}
            textAnchor="middle"
            fontSize={Math.max(7, size * 0.18)}
            fontWeight="800"
            fill={eventColor.text}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          >
            EV
          </text>
        </g>
      )}

      {hasTerrain && campLandmarks.has(landmark) && visibleCampTag && campTagColor && (
        <g className="pointer-events-none" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.25))">
          <rect
            x={campTagMarkerX - campTagBadgeWidth / 2}
            y={campTagMarkerY - campTagBadgeHeight / 2}
            width={campTagBadgeWidth}
            height={campTagBadgeHeight}
            rx={Math.max(3, size * 0.07)}
            fill={campTagColor.fill}
            stroke={campTagColor.stroke}
            strokeWidth={Math.max(1, size * 0.03)}
          />
          <text
            x={campTagMarkerX}
            y={campTagMarkerY + campTagFontSize * 0.35}
            textAnchor="middle"
            fontSize={campTagFontSize}
            fontWeight="800"
            fill={campTagColor.text}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            textLength={shouldCompressCampTagText ? campTagTextWidth : undefined}
            lengthAdjust={shouldCompressCampTagText ? "spacingAndGlyphs" : undefined}
          >
            {visibleCampTag}
          </text>
        </g>
      )}

      {/* Standard subtle coordinate labels in light text if user zooms in or debugs */}
      {hasTerrain && size >= 28 && (
        <text
          x={cx}
          y={cy + size * 0.65}
          textAnchor="middle"
          fontSize="10"
          className="fill-slate-500/80 font-mono tracking-tight pointer-events-none font-bold"
        >
          {q},{r}
        </text>
      )}

    </g>
  );
};

export const HexRenderer = React.memo(HexRendererComponent);
