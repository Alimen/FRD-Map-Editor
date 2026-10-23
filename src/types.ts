/**
 * @license
 * SPDX-License-Identifier: MIT
 */

export enum TerrainType {
  NONE = "none",
  PLAIN = "plain",
  HILL = "hill",
  MOUNTAIN = "mountain",
  LOWLAND = "lowland",
  LAKE = "lake"
}

export enum LandmarkType {
  NONE = "none",
  MAIN_DUNGEON = "mainDungeon",
  SUB_DUNGEON = "subDungeon",
  MAIN_CAMP = "mainCamp",
  SUB_CAMP = "subCamp",
}

export enum StyleVariant {
  NORMAL = "normal",
  DEMONIC = "demonic",
  LOVECRAFTIAN = "lovecraftian",
  UNDEAD = "undead",
  DRACONIC = "draconic",
}

export type Difficulty = 0 | 1 | 2 | 3 | 4 | 5;
export type BrushLayer = "terrain" | "landmark" | "style" | "travelEvent" | "campTag" | "difficulty" | "campLink";
export type PaintTool = "brush" | "bucket";
export type CampLinkTool = "create" | "remove";

export interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
  landmark: LandmarkType;
  style: StyleVariant;
  v: number;
  difficulty: Difficulty | null; // null for cells without terrain
}

export type TravelEventMap = Record<string, string>;
export type CampTagMap = Record<string, string>;

export interface CampLink {
  from: string; // Axial coordinate "q,r"
  to: string;
}

export interface MapData {
  radius: number;
  cells: Record<string, HexCell>; // Key is "q,r"
  travelEvents?: TravelEventMap; // Key is "q,r", value is event id
  campTags?: CampTagMap; // Key is "q,r", value is camp tag
  campLinks?: CampLink[];
}

export interface HistoryState {
  cells: Record<string, HexCell>;
  radius: number;
  travelEvents: TravelEventMap;
  campTags: CampTagMap;
  campLinks: CampLink[];
}
