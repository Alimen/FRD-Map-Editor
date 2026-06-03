/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { TerrainType, LandmarkType, StyleVariant } from "./types";

export interface TerrainConfig {
  type: TerrainType;
  label: string;
  color: string;           // Base background color
  borderColor: string;     // Border stroke color
  accentColor: string;     // Color for features
  bgGradient: string;      // Tailwind gradient class
}

export interface LandmarkConfig {
  type: LandmarkType;
  label: string;
  iconName: string;
}

export interface StyleConfig {
  type: StyleVariant;
  label: string;
  glowColor: string;
  textColor: string;
  bannerColor: string;
  accentColor: string;
  borderColor: string;
}

export const TERRAIN_CONFIGS: Record<TerrainType, TerrainConfig> = {
  [TerrainType.NONE]: {
    type: TerrainType.NONE,
    label: "無地形",
    color: "transparent",
    borderColor: "rgba(148, 163, 184, 0.3)",
    accentColor: "rgba(148, 163, 184, 0.35)",
    bgGradient: "from-transparent to-transparent",
  },
  [TerrainType.PLAIN]: {
    type: TerrainType.PLAIN,
    label: "平原",
    color: "#d4f0b4",
    borderColor: "#8fae68",
    accentColor: "#617d3d",
    bgGradient: "from-[#e2f7cf] to-[#c7e39a]",
  },
  [TerrainType.HILL]: {
    type: TerrainType.HILL,
    label: "丘陵",
    color: "#deeb71",
    borderColor: "#8fb84f",
    accentColor: "#5f7f2c",
    bgGradient: "from-[#e3f6ad] to-[#bfdc75]",
  },
  [TerrainType.MOUNTAIN]: {
    type: TerrainType.MOUNTAIN,
    label: "山地",
    color: "#ced6e0",
    borderColor: "#747d8c",
    accentColor: "#2f3542",
    bgGradient: "from-[#dfe4ea] to-[#b2bec3]",
  },
  [TerrainType.LOWLAND]: {
    type: TerrainType.LOWLAND,
    label: "窪地",
    color: "#5ecc9e",
    borderColor: "#1f8068",
    accentColor: "#145846",
    bgGradient: "from-[#45c6a2] to-[#218f72]",
  },
  [TerrainType.LAKE]: {
    type: TerrainType.LAKE,
    label: "湖泊",
    color: "#7dd3fc",
    borderColor: "#0284c7",
    accentColor: "#075985",
    bgGradient: "from-[#bae6fd] to-[#38bdf8]",
  },
};

export const LANDMARK_CONFIGS: Record<LandmarkType, LandmarkConfig> = {
  [LandmarkType.NONE]: {
    type: LandmarkType.NONE,
    label: "無建築",
    iconName: "none"
  },
  [LandmarkType.MAIN_DUNGEON]: {
    type: LandmarkType.MAIN_DUNGEON,
    label: "大地城",
    iconName: "Castle"
  },
  [LandmarkType.SUB_DUNGEON]: {
    type: LandmarkType.SUB_DUNGEON,
    label: "小地城",
    iconName: "Skull"
  },
  [LandmarkType.MAIN_CAMP]: {
    type: LandmarkType.MAIN_CAMP,
    label: "大營地",
    iconName: "Tent"
  },
  [LandmarkType.SUB_CAMP]: {
    type: LandmarkType.SUB_CAMP,
    label: "小營地",
    iconName: "FlameKindling"
  },
};

export const STYLE_CONFIGS: Record<StyleVariant, StyleConfig> = {
  [StyleVariant.NORMAL]: {
    type: StyleVariant.NORMAL,
    label: "正常的",
    glowColor: "rgba(255, 255, 255, 0.4)",
    textColor: "text-slate-800",
    bannerColor: "bg-slate-200",
    accentColor: "rgba(100, 116, 139, 0.2)",
    borderColor: "rgba(100, 116, 139, 0.4)",
  },
  [StyleVariant.DEMONIC]: {
    type: StyleVariant.DEMONIC,
    label: "惡魔的",
    glowColor: "rgba(245, 158, 11, 0.75)",
    textColor: "text-amber-700",
    bannerColor: "bg-amber-950 text-amber-200 border-amber-500",
    accentColor: "rgba(217, 119, 6, 0.4)",
    borderColor: "#d97706",
  },
  [StyleVariant.LOVECRAFTIAN]: {
    type: StyleVariant.LOVECRAFTIAN,
    label: "克蘇魯的",
    glowColor: "rgba(168, 85, 247, 0.75)",
    textColor: "text-purple-700",
    bannerColor: "bg-purple-950 text-purple-200 border-purple-500",
    accentColor: "rgba(147, 51, 234, 0.4)",
    borderColor: "#9333ea",
  },
  [StyleVariant.UNDEAD]: {
    type: StyleVariant.UNDEAD,
    label: "不死的",
    glowColor: "rgba(20, 184, 166, 0.75)",
    textColor: "text-teal-700",
    bannerColor: "bg-teal-950 text-teal-200 border-teal-500",
    accentColor: "rgba(13, 148, 136, 0.4)",
    borderColor: "#0d9488",
  },
  [StyleVariant.DRACONIC]: {
    type: StyleVariant.DRACONIC,
    label: "龍族的",
    glowColor: "rgba(239, 68, 68, 0.75)",
    textColor: "text-red-700",
    bannerColor: "bg-red-950 text-red-200 border-red-500",
    accentColor: "rgba(220, 38, 38, 0.4)",
    borderColor: "#dc2626",
  },
};
