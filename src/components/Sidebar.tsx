/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef, useState } from "react";
import { TerrainType, LandmarkType, StyleVariant } from "../types";
import { TERRAIN_CONFIGS, LANDMARK_CONFIGS, STYLE_CONFIGS } from "../constants";
import { getTravelEventColor } from "../travelEventColors";
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  Grid,
  MapPin,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  Compass,
  FileCode,
  BarChart3,
  Trash2,
  Copy,
  Check,
  Plus,
  PencilLine,
  Map,
  ArrowUp,
  ArrowDown,
  ScrollText
} from "lucide-react";

interface SidebarProps {
  // Painting Brush State
  activeLayer: "terrain" | "landmark" | "style" | "travelEvent";
  setActiveLayer: (layer: "terrain" | "landmark" | "style" | "travelEvent") => void;

  selectedTerrain: TerrainType;
  setSelectedTerrain: (t: TerrainType) => void;

  selectedLandmark: LandmarkType;
  setSelectedLandmark: (l: LandmarkType) => void;

  selectedStyle: StyleVariant;
  setSelectedStyle: (s: StyleVariant) => void;

  selectedTravelEvent: string;
  setSelectedTravelEvent: (eventId: string) => void;

  // Grid Controls
  radius: number;
  maxGridRadius: number;
  onResizeGrid: (newRadius: number) => void;

  // History Controls
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Map Atlas Controls
  maps: { id: string }[];
  selectedMapIndex: number;
  onSelectMap: (mapIndex: number) => void;
  onAddMap: () => void;
  onDuplicateMap: () => void;
  onDeleteMap: () => void;
  onRenameMap: (nextId: string) => void;
  onMoveMap: (direction: -1 | 1) => void;

  // JSON Operations
  exportJSON: () => void;
  importJSON: (data: string) => boolean;
  terrainCounts: Record<TerrainType, number>;
  getCurrentJSON: () => string;
}

type SidebarGroupId = "mapAtlas" | "brush" | "history" | "stats" | "grid" | "json";

interface CollapsibleGroupProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleGroup: React.FC<CollapsibleGroupProps> = ({
  title,
  icon,
  expanded,
  onToggle,
  children,
}) => (
  <section className="rounded-xl border border-slate-200/80 bg-slate-50/45 overflow-hidden shadow-sm shadow-slate-100/80">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left hover:bg-slate-100/70 transition-colors border-b border-slate-200/70"
    >
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {title}
      </span>
      {expanded ? (
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
    {expanded && (
      <div className="px-3.5 pb-3.5 pt-3">
        {children}
      </div>
    )}
  </section>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeLayer,
  setActiveLayer,
  selectedTerrain,
  setSelectedTerrain,
  selectedLandmark,
  setSelectedLandmark,
  selectedStyle,
  setSelectedStyle,
  selectedTravelEvent,
  setSelectedTravelEvent,
  radius,
  maxGridRadius,
  onResizeGrid,
  undo,
  redo,
  canUndo,
  canRedo,
  maps,
  selectedMapIndex,
  onSelectMap,
  onAddMap,
  onDuplicateMap,
  onDeleteMap,
  onRenameMap,
  onMoveMap,
  exportJSON,
  importJSON,
  terrainCounts,
  getCurrentJSON,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [inputRadiusInput, setInputRadiusInput] = useState<string>(String(radius));
  const [mapNameInput, setMapNameInput] = useState<string>(maps[selectedMapIndex]?.id ?? "");
  const [newTravelEventInput, setNewTravelEventInput] = useState<string>("");
  const [travelEventBrushes, setTravelEventBrushes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<SidebarGroupId, boolean>>({
    mapAtlas: true,
    brush: true,
    history: true,
    stats: true,
    grid: true,
    json: true,
  });

  const toggleGroup = (groupId: SidebarGroupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  useEffect(() => {
    setInputRadiusInput(String(radius));
  }, [radius]);

  useEffect(() => {
    setMapNameInput(maps[selectedMapIndex]?.id ?? "");
  }, [maps, selectedMapIndex]);

  // Handle direct file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const success = importJSON(text);
        if (success) {
          setJsonError(null);
        } else {
          setJsonError("JSON 格式不符或解析失敗");
        }
      };
      reader.readAsText(file);
    }
  };

  // Drag and drop JSON
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const success = importJSON(text);
        if (success) {
          setJsonError(null);
        } else {
          setJsonError("地圖載入失敗，請確認是否為有效的六角地圖 JSON");
        }
      };
      reader.readAsText(file);
    }
  };

  const normalizeRadiusInput = () => {
    const parsedRadius = Number.parseInt(inputRadiusInput, 10);
    const nextRadius = Number.isFinite(parsedRadius)
      ? Math.max(2, Math.min(maxGridRadius, parsedRadius))
      : radius;

    setInputRadiusInput(String(nextRadius));
    return nextRadius;
  };

  const handleResizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResizeGrid(normalizeRadiusInput());
  };

  const copyToClipboard = () => {
    const jsonStr = getCurrentJSON();
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddTravelEventBrush = (e: React.FormEvent) => {
    e.preventDefault();
    const eventId = newTravelEventInput.trim();
    if (!eventId) {
      return;
    }

    setTravelEventBrushes((prev) => prev.includes(eventId) ? prev : [...prev, eventId]);
    setSelectedTravelEvent(eventId);
    setNewTravelEventInput("");
  };

  return (
    <div className="w-full lg:w-96 bg-white border-r border-slate-200/80 flex flex-col h-full overflow-y-auto shrink-0 select-none shadow-sm">
      {/* App Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/55 flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg leading-tight font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            FRD 地圖編輯器</h1>
          <a
            href="https://github.com/Alimen/FRD-Map-Editor"
            target="_blank"
            rel="noreferrer"
            className="block text-[11px] leading-tight font-mono text-slate-400 hover:text-indigo-600 font-medium transition-colors"
          >https://github.com/Alimen/FRD-Map-Editor
          </a>
        </div>
      </div>

      {/* Main Tools Container */}
      <div className="p-5 flex-1 flex flex-col gap-4 divide-y divide-slate-200/80">
        {/* Map Atlas */}
        <CollapsibleGroup
          title="地圖集"
          icon={<Map className="w-3.5 h-3.5 text-slate-400" />}
          expanded={expandedGroups.mapAtlas}
          onToggle={() => toggleGroup("mapAtlas")}
        >
          <div className="space-y-2">
            <select
              id="atlas-map-select"
              value={selectedMapIndex}
              onChange={(e) => onSelectMap(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {maps.map((map, index) => (
                <option key={`${map.id}-${index}`} value={index}>
                  {index + 1}. {map.id}
                </option>
              ))}
            </select>

            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <PencilLine className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="atlas-map-name-input"
                  type="text"
                  value={mapNameInput}
                  onChange={(e) => setMapNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  onBlur={() => {
                    const nextName = mapNameInput.trim() || maps[selectedMapIndex]?.id || "001";
                    setMapNameInput(nextName);
                    onRenameMap(nextName);
                  }}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                id="atlas-move-map-up-btn"
                onClick={() => onMoveMap(-1)}
                disabled={selectedMapIndex <= 0}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                  selectedMapIndex > 0
                    ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-slate-100/50 text-slate-300 border-slate-200/40 cursor-not-allowed"
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>往前</span>
              </button>
              <button
                id="atlas-move-map-down-btn"
                onClick={() => onMoveMap(1)}
                disabled={selectedMapIndex >= maps.length - 1}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                  selectedMapIndex < maps.length - 1
                    ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-slate-100/50 text-slate-300 border-slate-200/40 cursor-not-allowed"
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>往後</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                id="atlas-add-map-btn"
                onClick={onAddMap}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold border border-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增</span>
              </button>
              <button
                id="atlas-duplicate-map-btn"
                onClick={onDuplicateMap}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>複製</span>
              </button>
              <button
                id="atlas-delete-map-btn"
                onClick={onDeleteMap}
                disabled={maps.length <= 1}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                  maps.length > 1
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100"
                    : "bg-slate-100/50 text-slate-300 border-slate-200/40 cursor-not-allowed"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>刪除</span>
              </button>
            </div>
          </div>
        </CollapsibleGroup>

        {/* Custom Grid size (支援自定義格數) */}
        <CollapsibleGroup
          title="自定義地圖格數"
          icon={<Grid className="w-3.5 h-3.5 text-slate-400" />}
          expanded={expandedGroups.grid}
          onToggle={() => toggleGroup("grid")}
        >
          <div className="space-y-3">
            <form onSubmit={handleResizeSubmit} className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  id="grid-radius-input"
                  type="number"
                  min="2"
                  max={maxGridRadius}
                  value={inputRadiusInput}
                  onChange={(e) => setInputRadiusInput(e.target.value)}
                  onBlur={normalizeRadiusInput}
                  className="w-full pl-3 pr-10 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 font-mono text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">層</span>
              </div>
              <button
                id="grid-resize-btn"
                type="submit"
                className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                調整大小
              </button>
            </form>
            <div className="text-[10px] text-slate-400 leading-relaxed">
              * 縮小半徑會裁切外圍格子，放大則會保留當前內容並往外拓展。
            </div>
          </div>
        </CollapsibleGroup>

        {/* Layer / Brush Modes */}
        <CollapsibleGroup
          title="編輯圖層與筆刷"
          icon={<Layers className="w-3.5 h-3.5 text-slate-400" />}
          expanded={expandedGroups.brush}
          onToggle={() => toggleGroup("brush")}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              <button
                id="layer-btn-terrain"
                onClick={() => setActiveLayer("terrain")}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  activeLayer === "terrain"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>地形</span>
              </button>
              <button
                id="layer-btn-landmark"
                onClick={() => setActiveLayer("landmark")}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  activeLayer === "landmark"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>地標</span>
              </button>
              <button
                id="layer-btn-style"
                onClick={() => setActiveLayer("style")}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  activeLayer === "style"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>風格</span>
              </button>
              <button
                id="layer-btn-travel-event"
                onClick={() => setActiveLayer("travelEvent")}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-1 ${
                  activeLayer === "travelEvent"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ScrollText className="w-4 h-4" />
                <span>事件</span>
              </button>
            </div>
          </div>

        {/* Paint Item Selector */}
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100">
          {activeLayer === "terrain" && (
            <div id="terrain-selector" className="space-y-3">
              <span className="text-xs font-bold text-slate-500 block mb-2">選擇地形種類</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(TERRAIN_CONFIGS).map((cfg) => (
                  <button
                    key={cfg.type}
                    onClick={() => setSelectedTerrain(cfg.type)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                      selectedTerrain === cfg.type
                        ? "bg-white border-indigo-500 border-2 shadow-sm font-semibold ring-1 ring-indigo-400"
                        : "bg-white/80 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded border shadow-inner shrink-0"
                      style={{ backgroundColor: cfg.color, borderColor: cfg.borderColor }}
                    />
                    <div className="text-xs text-slate-700">{cfg.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeLayer === "landmark" && (
            <div id="landmark-selector" className="space-y-2">
              <span className="text-xs font-bold text-slate-500 block mb-2">放置地標建築</span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {Object.values(LANDMARK_CONFIGS).map((cfg) => (
                  <button
                    key={cfg.type}
                    onClick={() => setSelectedLandmark(cfg.type)}
                    className={`w-full p-2 px-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                      selectedLandmark === cfg.type
                        ? "bg-white border-indigo-500 border-2 shadow-sm ring-1 ring-indigo-400 font-medium"
                        : "bg-white/80 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[9px] font-mono font-bold text-slate-600">
                        {cfg.label[0]}
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {cfg.label}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeLayer === "style" && (
            <div id="style-selector" className="space-y-3">
              <span className="text-xs font-bold text-slate-500 block mb-2">指定風格變體</span>
              <div className="space-y-1.5">
                {Object.values(STYLE_CONFIGS).map((cfg) => (
                  <button
                    key={cfg.type}
                    onClick={() => setSelectedStyle(cfg.type)}
                    className={`w-full p-2 px-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                      selectedStyle === cfg.type
                        ? "bg-white border-indigo-500 border-2 shadow-sm ring-1 ring-indigo-400 font-medium"
                        : "bg-white/80 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: cfg.borderColor }}
                      />
                      <span className={`text-xs font-medium ${cfg.textColor}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeLayer === "travelEvent" && (
            <div id="travel-event-selector" className="space-y-3">
              <span className="text-xs font-bold text-slate-500 block mb-2">指定旅行事件</span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <button
                  id="travel-event-none-btn"
                  onClick={() => setSelectedTravelEvent("")}
                  className={`w-full p-2 px-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                    selectedTravelEvent.trim() === ""
                      ? "bg-white border-indigo-500 border-2 shadow-sm ring-1 ring-indigo-400 font-medium"
                      : "bg-white/80 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 shrink-0" />
                    <span className="text-xs font-medium text-slate-700">
                      無事件
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {travelEventBrushes.map((eventId) => {
                  const eventColor = getTravelEventColor(eventId);

                  return (
                    <button
                      key={eventId}
                      onClick={() => setSelectedTravelEvent(eventId)}
                      className={`w-full p-2 px-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                        selectedTravelEvent === eventId
                          ? "bg-white border-indigo-500 border-2 shadow-sm ring-1 ring-indigo-400 font-medium"
                          : "bg-white/80 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full border shrink-0"
                          style={{
                            backgroundColor: eventColor.fill,
                            borderColor: eventColor.stroke,
                          }}
                        />
                        <span className="text-xs font-medium text-slate-700 font-mono truncate">
                          {eventId}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleAddTravelEventBrush} className="flex gap-2 items-center">
                <div className="relative flex-1 min-w-0">
                  <ScrollText className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="travel-event-input"
                    type="text"
                    value={newTravelEventInput}
                    onChange={(e) => setNewTravelEventInput(e.target.value)}
                    placeholder="encounter_1001"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  id="travel-event-add-btn"
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
                  title="新增旅行事件筆刷"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>
        </CollapsibleGroup>

        {/* History Controls */}
        <CollapsibleGroup
          title="歷史紀錄與還原"
          icon={<Undo2 className="w-3.5 h-3.5 text-slate-400" />}
          expanded={expandedGroups.history}
          onToggle={() => toggleGroup("history")}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              id="undo-btn"
              onClick={undo}
              disabled={!canUndo}
              className={`flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg font-medium text-xs border transition-all ${
                canUndo
                  ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  : "bg-slate-100/50 text-slate-300 border-slate-200/40 cursor-not-allowed"
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>復原 (Undo)</span>
            </button>
            <button
              id="redo-btn"
              onClick={redo}
              disabled={!canRedo}
              className={`flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg font-medium text-xs border transition-all ${
                canRedo
                  ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  : "bg-slate-100/50 text-slate-300 border-slate-200/40 cursor-not-allowed"
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span>重做 (Redo)</span>
            </button>
          </div>
        </CollapsibleGroup>

        {/* Terrain Stats */}
        <CollapsibleGroup
          title="統計"
          icon={<BarChart3 className="w-3.5 h-3.5 text-slate-400" />}
          expanded={expandedGroups.stats}
          onToggle={() => toggleGroup("stats")}
        >
          <div className="space-y-1.5">
            {Object.values(TERRAIN_CONFIGS)
              .filter((cfg) => cfg.type !== TerrainType.NONE)
              .map((cfg) => (
                <div
                  key={cfg.type}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white/80 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded border shadow-inner shrink-0"
                      style={{ backgroundColor: cfg.color, borderColor: cfg.borderColor }}
                    />
                    <span className="font-medium text-slate-700">{cfg.label}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-600">
                    {terrainCounts[cfg.type] ?? 0}
                  </span>
                </div>
              ))}
          </div>
        </CollapsibleGroup>

        {/* JSON Import & Export */}
        <CollapsibleGroup
          title="存檔與匯出匯入"
          icon={<FileCode className="w-3.5 h-3.5 text-slate-400" />}
          expanded={expandedGroups.json}
          onToggle={() => toggleGroup("json")}
        >
        <div className="space-y-3">
          {/* Drag & Drop Import zone */}
          <div
            id="json-dropzone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border border-dashed rounded-xl p-4 text-center transition-all ${
              dragActive
                ? "border-indigo-500 bg-indigo-50/40"
                : "border-slate-200 bg-slate-50/30 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <Upload className="w-5 h-5 text-slate-400 mx-auto mb-2 animate-bounce" />
            <span className="text-xs font-medium text-slate-600 block">
              拖入地圖 JSON 檔案
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              或點擊此處瀏覽載入
            </span>
          </div>

          {jsonError && (
            <div className="text-[10px] text-rose-500 font-medium bg-rose-50 p-2 rounded-lg border border-rose-100">
              {jsonError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              id="export-btn"
              onClick={exportJSON}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>匯出 JSON 檔</span>
            </button>
            <button
              id="copy-json-btn"
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">已複製 JSON</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>複製 JSON 文字</span>
                </>
              )}
            </button>
          </div>
        </div>
        </CollapsibleGroup>

      </div>
    </div>
  );
};
