export type JourneyState = { progress: number; phase: string };
type Point = [number, number, number];

export function smoothRange(value: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

// The same camera moves from the enclosure into the workshop and up to KEVIN.
const shots: { at: number; camera: Point; target: Point }[] = [
  { at: 0, camera: [0.6, 1.3, 10.5], target: [0, 0.1, 0] },
  { at: 0.12, camera: [0.3, 0.8, 8], target: [0, 0, -0.5] },
  { at: 0.3, camera: [0, 0.3, 2.5], target: [0, -0.3, -4] },
  { at: 0.43, camera: [5.8, 4.1, 0.8], target: [-2, -0.6, -7] },
  { at: 0.61, camera: [5.2, 2.7, -3], target: [-2.5, -0.3, -11.5] },
  { at: 0.76, camera: [3.2, 1.7, -5.5], target: [-2.6, 0, -13] },
  { at: 0.9, camera: [-1.8, 2.3, 6.5], target: [-3.8, 0, -13] },
  { at: 1, camera: [-1.8, 2.3, 6.5], target: [-3.8, 0, -13] },
];

export function sampleJourney(
  progress: number,
  mobile: boolean,
  reduced: boolean,
) {
  const p = reduced ? 0.95 : Math.max(0, Math.min(1, progress));
  const next = shots.findIndex((shot) => shot.at > p);
  const end = next === -1 ? shots.length - 1 : next;
  const start = Math.max(0, end - 1);
  const blend = smoothRange(p, shots[start].at, shots[end].at);
  const interpolate = (key: "camera" | "target"): Point =>
    shots[start][key].map(
      (v, i) => v + (shots[end][key][i] - v) * blend,
    ) as Point;
  const camera = interpolate("camera");
  const target = interpolate("target");
  if (mobile) {
    camera[0] *= 0.35;
    camera[2] +=
      4 + smoothRange(p, 0.3, 0.4) * 13 - smoothRange(p, 0.76, 0.9) * 12;
    target[0] = 0;
    target[1] -= 0.3 + smoothRange(p, 0.3, 0.4) * 1.5;
  }
  return {
    camera,
    target,
    open: smoothRange(p, 0.1, 0.28),
    enter: smoothRange(p, 0.2, 0.43),
    coreOpen: smoothRange(p, 0.67, 0.8),
    spread: smoothRange(p, 0.77, 0.91),
    phase:
      p < 0.12
        ? "arrival"
        : p < 0.3
          ? "enclosure"
          : p < 0.64
            ? "workshop"
            : p < 0.8
              ? "kevin"
              : "modules",
  };
}
