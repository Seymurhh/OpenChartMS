export interface Point {
  x: number;
  y: number;
}

// Andrew's monotone-chain convex hull. Returns vertices in counter-clockwise
// order. Operates on the points as given, so for log-scale envelopes the caller
// must pre-transform points to log space, then map the hull vertices back.
export function convexHull(points: Point[]): Point[] {
  if (points.length <= 2) return [...points];

  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const cross = (O: Point, A: Point, B: Point): number =>
    (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Drop last point of each half (it's the first of the other half).
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
