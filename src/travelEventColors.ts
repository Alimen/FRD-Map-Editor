/**
 * @license
 * SPDX-License-Identifier: MIT
 */

export interface TravelEventColor {
  fill: string;
  stroke: string;
  text: string;
}

const TRAVEL_EVENT_COLORS: TravelEventColor[] = [
  { fill: "#f59e0b", stroke: "#78350f", text: "#451a03" },
  { fill: "#22c55e", stroke: "#166534", text: "#052e16" },
  { fill: "#38bdf8", stroke: "#0369a1", text: "#082f49" },
  { fill: "#a78bfa", stroke: "#6d28d9", text: "#2e1065" },
  { fill: "#fb7185", stroke: "#be123c", text: "#4c0519" },
  { fill: "#facc15", stroke: "#a16207", text: "#422006" },
  { fill: "#2dd4bf", stroke: "#0f766e", text: "#042f2e" },
  { fill: "#f472b6", stroke: "#be185d", text: "#500724" },
  { fill: "#818cf8", stroke: "#4338ca", text: "#1e1b4b" },
  { fill: "#fb923c", stroke: "#c2410c", text: "#431407" },
];

export const getTravelEventColor = (eventId: string): TravelEventColor => {
  let hash = 2166136261;

  for (let index = 0; index < eventId.length; index += 1) {
    hash ^= eventId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return TRAVEL_EVENT_COLORS[Math.abs(hash) % TRAVEL_EVENT_COLORS.length];
};
