/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { HexCell, TerrainType, LandmarkType, StyleVariant } from "./types";
import { Sidebar } from "./components/Sidebar";
import { HexRenderer } from "./components/HexRenderer";
import { TERRAIN_CONFIGS, LANDMARK_CONFIGS, STYLE_CONFIGS } from "./constants";
import {
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Compass
} from "lucide-react";

const createCells = (radius: number, terrain: TerrainType): Record<string, HexCell> => {
  const emptyCells: Record<string, HexCell> = {};

  for (let q = -radius; q <= radius; q++) {
    const rStart = Math.max(-radius, -q - radius);
    const rEnd = Math.min(radius, -q + radius);
    for (let r = rStart; r <= rEnd; r++) {
      emptyCells[`${q},${r}`] = {
        q,
        r,
        terrain,
        landmark: LandmarkType.NONE,
        style: StyleVariant.NORMAL,
      };
    }
  }

  return emptyCells;
};

const createEmptyCells = (radius: number): Record<string, HexCell> => createCells(radius, TerrainType.PLAIN);
const createNoTerrainCells = (radius: number): Record<string, HexCell> => createCells(radius, TerrainType.NONE);

const terrainByCode = [
  TerrainType.PLAIN,
  TerrainType.HILL,
  TerrainType.MOUNTAIN,
  TerrainType.LOWLAND,
];

const landmarkByCode = [
  LandmarkType.NONE,
  LandmarkType.MAIN_DUNGEON,
  LandmarkType.SUB_DUNGEON,
  LandmarkType.MAIN_CAMP,
  LandmarkType.SUB_CAMP,
];

const styleByCode = [
  StyleVariant.NORMAL,
  StyleVariant.DEMONIC,
  StyleVariant.LOVECRAFTIAN,
  StyleVariant.UNDEAD,
  StyleVariant.DRACONIC,
];

const terrainToCode = new Map<TerrainType, number>(terrainByCode.map((type, code) => [type, code]));
const landmarkToCode = new Map<LandmarkType, number>(landmarkByCode.map((type, code) => [type, code]));
const styleToCode = new Map<StyleVariant, number>(styleByCode.map((type, code) => [type, code]));
const formatMapId = (index: number) => index.toString().padStart(3, "0");
const DEFAULT_MAP_ID = formatMapId(1);
const DEFAULT_MAP_RADIUS = 6;

const dungeonLandmarks = new Set<LandmarkType>([
  LandmarkType.MAIN_DUNGEON,
  LandmarkType.SUB_DUNGEON,
]);

const campLandmarks = new Set<LandmarkType>([
  LandmarkType.MAIN_CAMP,
  LandmarkType.SUB_CAMP,
]);

interface AtlasMap {
  id: string;
  radius: number;
  cells: Record<string, HexCell>;
}

const getNextMapId = (maps: AtlasMap[]) => {
  const nextIndex = maps.reduce((highest, map) => {
    return /^\d+$/.test(map.id) ? Math.max(highest, Number(map.id)) : highest;
  }, 0) + 1;

  return formatMapId(nextIndex);
};

const getHexDistanceFromOrigin = (q: number, r: number) => {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
};

export default function App() {
  // Grid Sizing state
  const [radius, setRadius] = useState<number>(DEFAULT_MAP_RADIUS);
  const [cellSize, setCellSize] = useState<number>(42);

  // Hex Cell State Map (Key is "q,r")
  const [cells, setCells] = useState<Record<string, HexCell>>(() => {
    return createEmptyCells(DEFAULT_MAP_RADIUS);
  });
  const [maps, setMaps] = useState<AtlasMap[]>(() => [
    {
      id: DEFAULT_MAP_ID,
      radius: DEFAULT_MAP_RADIUS,
      cells: createEmptyCells(DEFAULT_MAP_RADIUS),
    },
  ]);
  const [selectedMapIndex, setSelectedMapIndex] = useState<number>(0);

  // Hot selection editing states
  const [activeLayer, setActiveLayer] = useState<"terrain" | "landmark" | "style" | "eraser">("terrain");
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>(TerrainType.PLAIN);
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkType>(LandmarkType.MAIN_DUNGEON);
  const [selectedStyle, setSelectedStyle] = useState<StyleVariant>(StyleVariant.DEMONIC);

  // Coordination displays
  const [hoveredCell, setHoveredCell] = useState<HexCell | null>(null);

  // Dynamic Camera coordinates panning/zooming states
  const [scale, setScale] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Undo/Redo historical record arrays
  const [history, setHistory] = useState<{ cells: Record<string, HexCell>; radius: number }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // High performance painting states
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const strokeChangesRef = useRef<Record<string, HexCell> | null>(null);
  const [showDemoHelp, setShowDemoHelp] = useState<boolean>(true);

  const getMapsWithCurrentSnapshot = useCallback((): AtlasMap[] => {
    return maps.map((map, index) => index === selectedMapIndex ? {
      ...map,
      radius,
      cells: JSON.parse(JSON.stringify(cells)),
    } : map);
  }, [maps, selectedMapIndex, cells, radius]);

  const updateCurrentMapSnapshot = useCallback((nextCells: Record<string, HexCell>, nextRadius: number) => {
    setMaps((prevMaps) => prevMaps.map((map, index) => index === selectedMapIndex ? {
      ...map,
      radius: nextRadius,
      cells: JSON.parse(JSON.stringify(nextCells)),
    } : map));
  }, [selectedMapIndex]);

  const resetHistory = useCallback((nextCells: Record<string, HexCell>, nextRadius: number) => {
    setHistory([{ cells: JSON.parse(JSON.stringify(nextCells)), radius: nextRadius }]);
    setHistoryIndex(0);
  }, []);

  // Initialize History with current state
  useEffect(() => {
    const initialState = { cells: createEmptyCells(DEFAULT_MAP_RADIUS), radius: DEFAULT_MAP_RADIUS };
    setHistory([initialState]);
    setHistoryIndex(0);
  }, []);

  const pushToHistory = (newCells: Record<string, HexCell>, newRadius: number) => {
    const freshState = { cells: JSON.parse(JSON.stringify(newCells)), radius: newRadius };
    // Slice off any REDO redoable states
    const sliceHistory = history.slice(0, historyIndex + 1);
    const updatedHistory = [...sliceHistory, freshState];
    
    // Cap history length at 50 to avoid high memory impact
    if (updatedHistory.length > 50) {
      updatedHistory.shift();
      setHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);
    } else {
      setHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);
    }
  };

  const handleSelectMap = (mapIndex: number) => {
    if (mapIndex < 0 || mapIndex >= maps.length || mapIndex === selectedMapIndex) {
      return;
    }

    const nextMaps = getMapsWithCurrentSnapshot();
    const targetMap = nextMaps[mapIndex];
    setMaps(nextMaps);
    setSelectedMapIndex(mapIndex);
    setCells(JSON.parse(JSON.stringify(targetMap.cells)));
    setRadius(targetMap.radius);
    resetHistory(targetMap.cells, targetMap.radius);
    setHoveredCell(null);
    setPanX(0);
    setPanY(0);
    setScale(1);
  };

  const handleAddMap = () => {
    const nextMaps = getMapsWithCurrentSnapshot();
    const nextMap: AtlasMap = {
      id: getNextMapId(nextMaps),
      radius: DEFAULT_MAP_RADIUS,
      cells: createEmptyCells(DEFAULT_MAP_RADIUS),
    };

    setMaps([...nextMaps, nextMap]);
    setSelectedMapIndex(nextMaps.length);
    setCells(JSON.parse(JSON.stringify(nextMap.cells)));
    setRadius(nextMap.radius);
    resetHistory(nextMap.cells, nextMap.radius);
    setHoveredCell(null);
    setPanX(0);
    setPanY(0);
    setScale(1);
  };

  const handleDuplicateMap = () => {
    const nextMaps = getMapsWithCurrentSnapshot();
    const sourceMap = nextMaps[selectedMapIndex];
    const duplicatedMap: AtlasMap = {
      id: getNextMapId(nextMaps),
      radius: sourceMap.radius,
      cells: JSON.parse(JSON.stringify(sourceMap.cells)),
    };

    setMaps([...nextMaps, duplicatedMap]);
    setSelectedMapIndex(nextMaps.length);
    setCells(JSON.parse(JSON.stringify(duplicatedMap.cells)));
    setRadius(duplicatedMap.radius);
    resetHistory(duplicatedMap.cells, duplicatedMap.radius);
    setHoveredCell(null);
    setPanX(0);
    setPanY(0);
    setScale(1);
  };

  const handleDeleteMap = () => {
    if (maps.length <= 1) {
      return;
    }

    const nextMaps = getMapsWithCurrentSnapshot().filter((_, index) => index !== selectedMapIndex);
    const nextSelectedIndex = Math.min(selectedMapIndex, nextMaps.length - 1);
    const targetMap = nextMaps[nextSelectedIndex];

    setMaps(nextMaps);
    setSelectedMapIndex(nextSelectedIndex);
    setCells(JSON.parse(JSON.stringify(targetMap.cells)));
    setRadius(targetMap.radius);
    resetHistory(targetMap.cells, targetMap.radius);
    setHoveredCell(null);
    setPanX(0);
    setPanY(0);
    setScale(1);
  };

  const handleRenameMap = (nextId: string) => {
    const sanitizedId = nextId.trim();
    setMaps((prevMaps) => prevMaps.map((map, index) => index === selectedMapIndex ? {
      ...map,
      id: sanitizedId || map.id,
    } : map));
  };

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const targetState = history[prevIndex];
      setCells(JSON.parse(JSON.stringify(targetState.cells)));
      setRadius(targetState.radius);
      updateCurrentMapSnapshot(targetState.cells, targetState.radius);
      setHistoryIndex(prevIndex);
    }
  }, [historyIndex, history, updateCurrentMapSnapshot]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetState = history[nextIndex];
      setCells(JSON.parse(JSON.stringify(targetState.cells)));
      setRadius(targetState.radius);
      updateCurrentMapSnapshot(targetState.cells, targetState.radius);
      setHistoryIndex(nextIndex);
    }
  }, [historyIndex, history, updateCurrentMapSnapshot]);

  // Customizable grid resizing (支援自定義格數)
  const handleResizeGrid = (newRadius: number) => {
    const newCells: Record<string, HexCell> = {};
    for (let q = -newRadius; q <= newRadius; q++) {
      const rStart = Math.max(-newRadius, -q - newRadius);
      const rEnd = Math.min(newRadius, -q + newRadius);
      for (let r = rStart; r <= rEnd; r++) {
        const key = `${q},${r}`;
        if (cells[key]) {
          newCells[key] = { ...cells[key] };
        } else {
          // Initialize outer expansion
          newCells[key] = {
            q,
            r,
            terrain: TerrainType.NONE,
            landmark: LandmarkType.NONE,
            style: StyleVariant.NORMAL,
          };
        }
      }
    }
    pushToHistory(newCells, newRadius);
    setCells(newCells);
    setRadius(newRadius);
    updateCurrentMapSnapshot(newCells, newRadius);
    
    // Auto center map camera
    setPanX(0);
    setPanY(0);
  };

  // Cell Painter logic
  const paintCell = useCallback((targetCell: HexCell) => {
    const key = `${targetCell.q},${targetCell.r}`;
    const previous = cells[key];
    if (!previous) return;

    let updatedCell = { ...previous };

    if (activeLayer === "eraser") {
      updatedCell.terrain = TerrainType.PLAIN;
      updatedCell.landmark = LandmarkType.NONE;
      updatedCell.style = StyleVariant.NORMAL;
    } else if (activeLayer === "terrain") {
      updatedCell.terrain = selectedTerrain;
      if (selectedTerrain === TerrainType.NONE) {
        updatedCell.landmark = LandmarkType.NONE;
        updatedCell.style = StyleVariant.NORMAL;
      }
    } else if (activeLayer === "landmark") {
      updatedCell.landmark = selectedLandmark;
    } else if (activeLayer === "style") {
      updatedCell.style = selectedStyle;
    }

    // Check if cell parameters actually changed to avoid saving redundant modifications
    if (
      updatedCell.terrain === previous.terrain &&
      updatedCell.landmark === previous.landmark &&
      updatedCell.style === previous.style
    ) {
      return;
    }

    const nextCells = { ...cells, [key]: updatedCell };
    setCells(nextCells);
    updateCurrentMapSnapshot(nextCells, radius);

    // Accumulate alterations within the active paint stroke
    if (strokeChangesRef.current) {
      strokeChangesRef.current[key] = updatedCell;
    }
  }, [cells, radius, activeLayer, selectedTerrain, selectedLandmark, selectedStyle, updateCurrentMapSnapshot]);

  // Pointer triggers
  const handleHexMouseDown = (e: React.MouseEvent, cell: HexCell) => {
    // Only paint with left clicks
    if (e.button !== 0) return;
    setIsMouseDown(true);
    // Begin a paint transaction
    strokeChangesRef.current = {};
    paintCell(cell);
  };

  const handleHexMouseEnter = (e: React.MouseEvent, cell: HexCell) => {
    setHoveredCell(cell);
    if (isMouseDown) {
      paintCell(cell);
    }
  };

  const handleHexMouseLeave = (e: React.MouseEvent, cell: HexCell) => {
    if (hoveredCell?.q === cell.q && hoveredCell?.r === cell.r) {
      setHoveredCell(null);
    }
  };

  // Canvas Drag/Pan
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Right click or Middle click or Left click while targeting background allows dragging
    const targetElement = e.target as SVGElement;
    const isBackground = targetElement.classList.contains("background-grip") || targetElement.tagName === "svg";
    
    if (e.button === 2 || e.button === 1 || isBackground) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanX(e.clientX - panStartRef.current.x);
      setPanY(e.clientY - panStartRef.current.y);
    }
  };

  // Window mouseup listener terminates active states and commits history
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      setIsPanning(false);

      // Stroke holds paint changes? Commit as a individual historic state
      if (strokeChangesRef.current && Object.keys(strokeChangesRef.current).length > 0) {
        pushToHistory(cells, radius);
      }
      strokeChangesRef.current = null;
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [cells, radius, pushToHistory]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.08;
    const newScale = e.deltaY < 0 ? scale + zoomFactor : scale - zoomFactor;
    setScale(Math.max(0.4, Math.min(2.5, newScale)));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, prev + 0.15));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.4, prev - 0.15));
  };

  const handleResetCamera = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  };

  // Prevent right-click context menu on workspace (for flawless panning)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const serializeMap = (map: AtlasMap) => {
    const exportCells = (Object.values(map.cells) as HexCell[]).filter((c) => c.terrain !== TerrainType.NONE);
    return {
      id: map.id,
      world: {
        radius: map.radius,
        tiles: exportCells.map((c) => ({
          c: `${c.q},${c.r}`,
          t: terrainToCode.get(c.terrain) ?? 0,
          l: styleToCode.get(c.style) ?? 0,
          f: landmarkToCode.get(c.landmark) ?? 0,
        })),
        dungeonCoords: exportCells
          .filter((c) => dungeonLandmarks.has(c.landmark))
          .map((c) => `${c.q},${c.r}`),
        campCoords: exportCells
          .filter((c) => campLandmarks.has(c.landmark))
          .map((c) => `${c.q},${c.r}`),
      },
    };
  };

  const parseImportedMap = (data: any, fallbackId: string): AtlasMap | null => {
    const importedCells = Array.isArray(data) ? data : data.world?.tiles ?? data.tiles ?? data.cells;
    if (!Array.isArray(importedCells)) {
      return null;
    }

    const incomingCells: Record<string, HexCell> = {};
    let inferredRadius = 0;

    importedCells.forEach((c: any) => {
      let nextCell: HexCell | null = null;

      if (typeof c.c === "string") {
        const [qText, rText] = c.c.split(",");
        const q = Number(qText);
        const r = Number(rText);

        if (Number.isFinite(q) && Number.isFinite(r)) {
          nextCell = {
            q,
            r,
            terrain: terrainByCode[c.t] ?? TerrainType.PLAIN,
            landmark: landmarkByCode[c.f] ?? LandmarkType.NONE,
            style: styleByCode[c.l] ?? StyleVariant.NORMAL,
          };
        }
      } else if (typeof c.q === "number" && typeof c.r === "number") {
        nextCell = {
          q: c.q,
          r: c.r,
          terrain: c.terrain || TerrainType.PLAIN,
          landmark: c.landmark || LandmarkType.NONE,
          style: c.style || StyleVariant.NORMAL,
        };
      }

      if (nextCell) {
        incomingCells[`${nextCell.q},${nextCell.r}`] = nextCell;
        inferredRadius = Math.max(inferredRadius, getHexDistanceFromOrigin(nextCell.q, nextCell.r));
      }
    });

    if (Object.keys(incomingCells).length === 0) {
      return null;
    }

    const nextRadius = typeof data.world?.radius === "number"
      ? data.world.radius
      : typeof data.radius === "number"
        ? data.radius
        : inferredRadius;

    return {
      id: typeof data.id === "string" && data.id.trim() ? data.id.trim() : fallbackId,
      radius: nextRadius,
      cells: { ...createNoTerrainCells(nextRadius), ...incomingCells },
    };
  };

  // Export JSON string output
  const getCurrentJSON = (): string => {
    const exportData = getMapsWithCurrentSnapshot().map((map) => serializeMap(map));
    return JSON.stringify(exportData, null, 2);
  };

  const terrainCounts = (Object.values(cells) as HexCell[]).reduce(
    (counts, cell) => {
      counts[cell.terrain] = (counts[cell.terrain] ?? 0) + 1;
      return counts;
    },
    {
      [TerrainType.NONE]: 0,
      [TerrainType.PLAIN]: 0,
      [TerrainType.HILL]: 0,
      [TerrainType.MOUNTAIN]: 0,
      [TerrainType.LOWLAND]: 0,
    } as Record<TerrainType, number>
  );

  // File download helper
  const handleExportJSON = () => {
    const jsonStr = getCurrentJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mapLib.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON validator and parser
  const handleImportJSON = (jsonText: string): boolean => {
    try {
      const data = JSON.parse(jsonText);
      const isMapCollection = Array.isArray(data) && data.some((item) => item?.world || typeof item?.id === "string");
      const importedMaps = isMapCollection
        ? data.map((item, index) => parseImportedMap(item, formatMapId(index + 1))).filter(Boolean) as AtlasMap[]
        : [parseImportedMap(data, DEFAULT_MAP_ID)].filter(Boolean) as AtlasMap[];

      if (importedMaps.length === 0) {
        return false;
      }

      const firstMap = importedMaps[0];

      setMaps(importedMaps);
      setSelectedMapIndex(0);
      setRadius(firstMap.radius);
      setCells(JSON.parse(JSON.stringify(firstMap.cells)));
      resetHistory(firstMap.cells, firstMap.radius);

      // Reset camera view
      setPanX(0);
      setPanY(0);
      setScale(1);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Sidebar Toolpanel */}
      <Sidebar
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        selectedTerrain={selectedTerrain}
        setSelectedTerrain={setSelectedTerrain}
        selectedLandmark={selectedLandmark}
        setSelectedLandmark={setSelectedLandmark}
        selectedStyle={selectedStyle}
        setSelectedStyle={setSelectedStyle}
        radius={radius}
        onResizeGrid={handleResizeGrid}
        undo={handleUndo}
        redo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        maps={maps.map((map) => ({ id: map.id }))}
        selectedMapIndex={selectedMapIndex}
        onSelectMap={handleSelectMap}
        onAddMap={handleAddMap}
        onDuplicateMap={handleDuplicateMap}
        onDeleteMap={handleDeleteMap}
        onRenameMap={handleRenameMap}
        exportJSON={handleExportJSON}
        importJSON={handleImportJSON}
        terrainCounts={terrainCounts}
        getCurrentJSON={getCurrentJSON}
      />

      {/* Main Interactive Map Canvas Space */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Navigation / Control overlays */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {/* Zoom & Helper Pill */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
              title="放大 (Move to Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
              title="縮小 (Move to Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetCamera}
              className="px-2 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="重設視角"
            >
              重置視角
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <div className="px-2 text-[11px] font-mono font-semibold text-slate-400">
              {Math.round(scale * 100)}%
            </div>
          </div>

        </div>

        {/* Floating Quick Action Keys Panel (Top Right) */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setShowDemoHelp((prev) => !prev)}
            className="p-2 bg-white/95 backdrop-blur border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl shadow-lg transition-colors"
            title="操作指示"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Demo operational help alert popup */}
        {showDemoHelp && (
          <div className="absolute bottom-4 right-4 z-20 max-w-sm bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl shadow-slate-200/40 border border-slate-200/80 text-xs text-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} />
                </span>
                滑鼠探索與編輯捷徑
              </span>
              <button
                onClick={() => setShowDemoHelp(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-mono scale-110 px-1.5 py-0.5 rounded-md transition-colors"
              >
                ×
              </button>
            </div>
            <ul className="space-y-2 leading-relaxed font-sans">
              <li className="flex items-start gap-2 rounded-lg bg-slate-50/70 border border-slate-100 px-3 py-2">
                <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <span><strong className="text-slate-800">拖曳著色：</strong>按住滑鼠左鍵並行經格子，可快速連續刷上選取的屬性。</span>
              </li>
              <li className="flex items-start gap-2 rounded-lg bg-slate-50/70 border border-slate-100 px-3 py-2">
                <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <span><strong className="text-slate-800">視野平移：</strong>在空白處按住<strong>左鍵拖曳</strong>、按住<strong>中鍵滾輪</strong>，或使用<strong>右鍵拖曳</strong>，即可平移視圖。</span>
              </li>
              <li className="flex items-start gap-2 rounded-lg bg-slate-50/70 border border-slate-100 px-3 py-2">
                <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                <span><strong className="text-slate-800">滾輪縮放：</strong>在畫面上滑動滑鼠滾輪，便能直接放大縮小格線。</span>
              </li>
            </ul>
          </div>
        )}

        {/* Coordinate & Grid Inspector Panel */}
        <div id="inspector-panel" className="absolute bottom-4 left-4 z-10 w-[min(22rem,calc(100%-2rem))] bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200/80 shadow-xl shadow-slate-900/20 text-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            當前格子座標探測
          </span>
          {hoveredCell ? (
            <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-sm flex flex-col space-y-1.5">
              <div className="flex items-center justify-between gap-3">
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

        </div>

        {/* Interactive Workspace SVG Map Container */}
        <div
          id="map-container-canvas"
          className="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center cursor-all-scroll active:cursor-grabbing select-none"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
        >
          {/* Fanciful blueprint grid background effect */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          {/* Epic ambient core glow in center */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

          {/* Primary SVG Vector workspace content */}
          <svg
            id="hex-editor-svg"
            className="w-full h-full drop-shadow-2xl transition-transform duration-75 ease-out select-none"
            style={{ pointerEvents: "auto" }}
          >
            {/* Embedded Definitions & Gradients for High fidelity visualization */}
            <defs>
              {/* Terrain Gradients */}
              <linearGradient id={`grad-${TerrainType.PLAIN}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d2f1b0" />
                <stop offset="100%" stopColor="#a9dd7f" />
              </linearGradient>
              <linearGradient id={`grad-${TerrainType.HILL}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fae7b9" />
                <stop offset="100%" stopColor="#dfbf75" />
              </linearGradient>
              <linearGradient id={`grad-${TerrainType.MOUNTAIN}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ecdfe8" />
                <stop offset="100%" stopColor="#9a9fade" />
              </linearGradient>
              <linearGradient id={`grad-${TerrainType.LOWLAND}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bce7fb" />
                <stop offset="100%" stopColor="#7cbdd8" />
              </linearGradient>
            </defs>

            {/* Transform Group carrying Pan & Zoom settings */}
            <g transform={`translate(${panX + (window.innerWidth - (window.innerWidth < 1024 ? 0 : 384)) / 2}, ${panY + window.innerHeight / 2}) scale(${scale})`}>
              {/* Outer radius circular boundary backing */}
              <circle
                cx="0"
                cy="0"
                r={cellSize * 1.62 * radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1.5"
                strokeDasharray="5,15"
                style={{ pointerEvents: "none" }}
              />

              {/* Loop rendering each hex cell within radius boundaries */}
              {(Object.values(cells) as HexCell[]).map((cell) => {
                const key = `${cell.q},${cell.r}`;
                const isHovered = hoveredCell?.q === cell.q && hoveredCell?.r === cell.r;

                return (
                  <HexRenderer
                    key={key}
                    cell={cell}
                    size={cellSize}
                    isHovered={isHovered}
                    isSelected={false}
                    onMouseEnter={handleHexMouseEnter}
                    onMouseLeave={handleHexMouseLeave}
                    onMouseDown={handleHexMouseDown}
                  />
                );
              })}

            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
