/**
 * Geometry for the want "tag": a price-tag silhouette with a blunt nose on the
 * left and a punched hole. Pure so it can be unit tested.
 */
export const TAG = {
  /** Where the flat body starts; content must sit right of the hole. */
  noseWidth: 18,
  /** Half-height of the blunt nose tip. */
  tipHalf: 7,
  tipX: 3,
  holeX: 17,
  holeR: 4.5,
  cornerR: 16,
  /** Left padding that clears the nose and hole with room to spare. */
  contentInset: 36,
} as const;

export function tagPath(width: number, height: number): string {
  const { noseWidth: n, tipHalf, tipX, holeX, holeR, cornerR } = TAG;
  const r = Math.min(cornerR, height / 2, (width - n) / 2);
  const mid = height / 2;
  const outer = [
    `M ${n} 0`,
    `H ${width - r}`,
    `A ${r} ${r} 0 0 1 ${width} ${r}`,
    `V ${height - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${height}`,
    `H ${n}`,
    `L ${tipX} ${mid + tipHalf}`,
    `L ${tipX} ${mid - tipHalf}`,
    "Z",
  ].join(" ");
  // Two half-arcs make the hole; drawn with fillRule="evenodd" it cuts through.
  const hole = [
    `M ${holeX - holeR} ${mid}`,
    `a ${holeR} ${holeR} 0 1 0 ${holeR * 2} 0`,
    `a ${holeR} ${holeR} 0 1 0 ${-holeR * 2} 0`,
    "Z",
  ].join(" ");
  return `${outer} ${hole}`;
}
