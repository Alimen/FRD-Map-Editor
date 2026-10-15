import { DEFAULT_DIFFICULTY } from "./difficulty";
import { CampTagMap, Difficulty, HexCell, LandmarkType, StyleVariant, TerrainType, TravelEventMap } from "./types";

type FillSelection =
  | { layer: "terrain"; value: TerrainType }
  | { layer: "difficulty"; value: Difficulty };

const neighbors = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];

export const paintTerrain = (cell: HexCell, terrain: TerrainType, rollVariant: () => number): HexCell => ({
  ...cell,
  terrain,
  v: cell.terrain === terrain ? cell.v : rollVariant(),
  difficulty: terrain === TerrainType.NONE ? null : cell.terrain === TerrainType.NONE ? DEFAULT_DIFFICULTY : cell.difficulty,
  landmark: terrain === TerrainType.NONE ? LandmarkType.NONE : cell.landmark,
  style: terrain === TerrainType.NONE ? StyleVariant.NORMAL : cell.style,
});

// Read connectivity from the original cells and apply the whole fill in one batch.
export const fillRegion = (
  cells: Record<string, HexCell>,
  travelEvents: TravelEventMap,
  campTags: CampTagMap,
  startKey: string,
  selection: FillSelection,
  rollVariant: () => number,
) => {
  const start = cells[startKey];
  if (!start || (selection.layer === "difficulty" && start.terrain === TerrainType.NONE)) return null;
  if (start[selection.layer] === selection.value) return null;

  const nextCells = { ...cells };
  let nextTravelEvents = travelEvents;
  let nextCampTags = campTags;
  const queue = [startKey];
  const visited = new Set(queue);

  for (let index = 0; index < queue.length; index++) {
    const key = queue[index];
    const cell = cells[key];
    if (!cell || cell[selection.layer] !== start[selection.layer]) continue;
    if (selection.layer === "difficulty" && cell.terrain === TerrainType.NONE) continue;

    nextCells[key] = selection.layer === "terrain"
      ? paintTerrain(cell, selection.value, rollVariant)
      : { ...cell, difficulty: selection.value };

    if (selection.layer === "terrain" && selection.value === TerrainType.NONE) {
      if (key in nextTravelEvents) {
        if (nextTravelEvents === travelEvents) nextTravelEvents = { ...travelEvents };
        delete nextTravelEvents[key];
      }
      if (key in nextCampTags) {
        if (nextCampTags === campTags) nextCampTags = { ...campTags };
        delete nextCampTags[key];
      }
    }

    for (const [dq, dr] of neighbors) {
      const neighborKey = `${cell.q + dq},${cell.r + dr}`;
      if (!visited.has(neighborKey) && cells[neighborKey]) {
        visited.add(neighborKey);
        queue.push(neighborKey);
      }
    }
  }

  return { cells: nextCells, travelEvents: nextTravelEvents, campTags: nextCampTags };
};
