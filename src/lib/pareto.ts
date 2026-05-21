export interface ParetoPoint {
  id: string;
  x: number;
  y: number;
}

// Returns the IDs of non-dominated points (minimizing both x and y).
// A point P is on the Pareto front iff no other point has both x' <= P.x and
// y' <= P.y with at least one strict inequality.
export function paretoFront(points: ParetoPoint[]): Set<string> {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const front = new Set<string>();
  let bestY = Infinity;
  for (const p of sorted) {
    if (p.y < bestY) {
      front.add(p.id);
      bestY = p.y;
    }
  }
  return front;
}

// Same as paretoFront but returns the points themselves in x-ascending order,
// suitable for drawing the front as a polyline.
export function paretoFrontOrdered<T extends ParetoPoint>(points: T[]): T[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const front: T[] = [];
  let bestY = Infinity;
  for (const p of sorted) {
    if (p.y < bestY) {
      front.push(p);
      bestY = p.y;
    }
  }
  return front;
}
