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

export interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
  landmark: LandmarkType;
  style: StyleVariant;
  v: number;
}

export type TravelEventMap = Record<string, string>;

export interface MapData {
  radius: number;
  cells: Record<string, HexCell>; // Key is "q,r"
  travelEvents?: TravelEventMap; // Key is "q,r", value is event id
}

export interface HistoryState {
  cells: Record<string, HexCell>;
  radius: number;
  travelEvents: TravelEventMap;
}
