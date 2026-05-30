/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { TerrainType, LandmarkType, StyleVariant, HexCell } from "../types";
import { TERRAIN_CONFIGS, LANDMARK_CONFIGS, STYLE_CONFIGS } from "../constants";
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  Eraser,
  Grid,
  MapPin,
  Sparkles,
  Layers,
  ChevronRight,
  Compass,
  FileCode,
  Trash2,
  Copy,
  Check,
  Plus,
  PencilLine,
  Map
} from "lucide-react";

interface SidebarProps {
  // Painting Brush State
  activeLayer: "terrain" | "landmark" | "style" | "eraser";
  setActiveLayer: (layer: "terrain" | "landmark" | "style" | "eraser") => void;

  selectedTerrain: TerrainType;
  setSelectedTerrain: (t: TerrainType) => void;

  selectedLandmark: LandmarkType;
  setSelectedLandmark: (l: LandmarkType) => void;

  selectedStyle: StyleVariant;
  setSelectedStyle: (s: StyleVariant) => void;

  // Grid Controls
  radius: number;
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
  onDeleteMap: () => void;
  onRenameMap: (nextId: string) => void;

  // JSON Operations
  exportJSON: () => void;
  importJSON: (data: string) => boolean;
  onClearMap: () => void;
  getCurrentJSON: () => string;

  // Live coordinates display under mouse
  hoveredCell: HexCell | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeLayer,
  setActiveLayer,
  selectedTerrain,
  setSelectedTerrain,
  selectedLandmark,
  setSelectedLandmark,
  selectedStyle,
  setSelectedStyle,
  radius,
  onResizeGrid,
  undo,
  redo,
  canUndo,
  canRedo,
  maps,
  selectedMapIndex,
  onSelectMap,
  onAddMap,
  onDeleteMap,
  onRenameMap,
  exportJSON,
  importJSON,
  onClearMap,
  getCurrentJSON,
  hoveredCell,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [inputRadius, setInputRadius] = useState<number>(radius);
  const [mapNameInput, setMapNameInput] = useState<string>(maps[selectedMapIndex]?.id ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInputRadius(radius);
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

  const handleResizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRadius >= 2 && inputRadius <= 15) {
      onResizeGrid(inputRadius);
    }
  };

  const copyToClipboard = () => {
    const jsonStr = getCurrentJSON();
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full lg:w-96 bg-white border-r border-slate-200/80 flex flex-col h-full overflow-y-auto shrink-0 select-none shadow-sm">
      {/* App Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/55 flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            奇幻六角地圖編輯器
          </h1>
          <p className="text-[11px] font-mono text-slate-400 font-medium">POINT TOP • AXIAL COORDINATES</p>
        </div>
      </div>

      {/* Main Tools Container */}
      <div className="p-5 flex-1 flex flex-col space-y-6">
        {/* Map Atlas */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-slate-400" />
            地圖集
          </span>

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
                    const nextName = mapNameInput.trim() || maps[selectedMapIndex]?.id || "map-1";
                    setMapNameInput(nextName);
                    onRenameMap(nextName);
                  }}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="atlas-add-map-btn"
                onClick={onAddMap}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增地圖</span>
              </button>
              <button
                id="atlas-delete-map-btn"
                onClick={onDeleteMap}
                disabled={maps.length <= 1}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                  maps.length > 1
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100"
                    : "bg-slate-100/50 text-slate-300 border-slate-200/40 cursor-not-allowed"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>刪除目前地圖</span>
              </button>
            </div>
          </div>
        </div>

        {/* Layer / Brush Modes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              編輯圖層與筆刷
            </span>
            {activeLayer === "eraser" && (
              <span className="text-[11px] font-medium bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                <Eraser className="w-2.5 h-2.5" /> 橡皮擦模式
              </span>
            )}
          </div>

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
              id="layer-btn-eraser"
              onClick={() => setActiveLayer("eraser")}
              className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all flex flex-col items-center gap-1 ${
                activeLayer === "eraser"
                  ? "bg-rose-500 text-white shadow-inner"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eraser className="w-4 h-4" />
              <span>清除</span>
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
                    className={`w-full p-2 rounded-lg border text-left transition-all flex items-start gap-3 ${
                      selectedLandmark === cfg.type
                        ? "bg-white border-indigo-500 border-2 shadow-sm ring-1 ring-indigo-400 font-medium"
                        : "bg-white/80 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="p-2 bg-slate-100 rounded text-slate-600 border border-slate-200 shadow-sm shrink-0 mt-0.5">
                      <span className="text-xs font-mono font-bold">{cfg.label[0]}</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{cfg.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        {cfg.description}
                      </div>
                    </div>
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

          {activeLayer === "eraser" && (
            <div id="eraser-description" className="py-2 text-center text-slate-500">
              <p className="text-xs">請點擊或拖曳畫筆抹除格子的屬性。</p>
              <p className="text-[10px] text-slate-400 mt-1">這會將地形還原至平原，並移除地標與風格效果。</p>
            </div>
          )}
        </div>

        {/* History Controls */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Undo2 className="w-3.5 h-3.5 text-slate-400" />
            歷史記錄與復原
          </span>
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
        </div>

        {/* Custom Grid size (支援自定義格數) */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-slate-400" />
            自定義地圖格數 (半徑)
          </span>

          <form onSubmit={handleResizeSubmit} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                id="grid-radius-input"
                type="number"
                min="2"
                max="15"
                value={inputRadius}
                onChange={(e) => setInputRadius(Math.max(2, Math.min(15, parseInt(e.target.value) || 2)))}
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

        {/* JSON Import & Export */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            存檔與匯出匯入 (JSON)
          </span>

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

      </div>

      {/* Coordinate & Grid Inspector Panel */}
      <div id="inspector-panel" className="p-4 bg-slate-50 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          當前格子座標探測
        </span>
        {hoveredCell ? (
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-sm flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 font-mono">
                Axial: ({hoveredCell.q}, {hoveredCell.r})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Cube: ({hoveredCell.q}, {hoveredCell.r}, {-hoveredCell.q - hoveredCell.r})
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[10px]">地形:</span>
                <span className="font-bold text-slate-700">{TERRAIN_CONFIGS[hoveredCell.terrain]?.label || hoveredCell.terrain}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[10px]">地標:</span>
                <span className="font-bold text-slate-700">{LANDMARK_CONFIGS[hoveredCell.landmark]?.label || hoveredCell.landmark}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 text-xs text-slate-600">
              <span className="text-slate-400 text-[10px]">風格:</span>
              <span className="font-semibold text-slate-700" style={{ color: STYLE_CONFIGS[hoveredCell.style]?.borderColor }}>
                {STYLE_CONFIGS[hoveredCell.style]?.label}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic text-center py-2 border border-dashed border-slate-200 rounded-lg">
            將滑鼠移至地圖上即可看見座標資訊
          </div>
        )}

        <button
          id="clear-all-btn"
          onClick={onClearMap}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-all border border-rose-100/50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>清除整張地圖</span>
        </button>
      </div>
    </div>
  );
};
