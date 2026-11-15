export type JourneyState = { progress: number };
export type Point = [number, number, number];

export function smoothRange(value: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

// The camera enters a solid server cabinet through two sequential doors.
// The room keeps its world scale and is revealed behind the rear doorway.
const shots: { at: number; camera: Point; target: Point }[] = [
  { at: 0, camera: [4.5, 3.2, 11.5], target: [0, 1.6, 0] },
  { at: 0.1, camera: [2.8, 1.6, 8.5], target: [0, 0.6, 0] },
  { at: 0.18, camera: [0, 0.3, 6], target: [0, 0, -4] },
  { at: 0.25, camera: [0, 0, 1.65], target: [0, 0, -8] },
  { at: 0.28, camera: [0, 0, 0.25], target: [0, 0, -10] },
  { at: 0.31, camera: [0, 0, -0.9], target: [0, 0, -13] },
  { at: 0.34, camera: [0, 0, -1.8], target: [0, 0, -13] },
  { at: 0.4, camera: [0, 0.8, -3.2], target: [0, -0.2, -13] },
  { at: 0.46, camera: [0, 0.8, -3.2], target: [0, -0.2, -13] },
  { at: 0.64, camera: [3, 1.8, -3], target: [-2.3, 0, -13] },
  { at: 0.8, camera: [3, 1.8, -3.5], target: [-2, 0, -13] },
  { at: 0.93, camera: [2, 1.8, -2], target: [-3.2, 0, -13] },
  { at: 1, camera: [2, 1.8, -2], target: [-3.2, 0, -13] },
];

export function sampleJourney(
  progress: number,
  mobile: boolean,
  reduced: boolean,
) {
  const p = reduced ? 0.95 : Math.max(0, Math.min(1, progress));
  const end = Math.max(
    1,
    shots.findIndex((shot) => shot.at >= p),
  );
  const start = end - 1;
  const duration = shots[end].at - shots[start].at;
  const t = Math.max(0, Math.min(1, (p - shots[start].at) / duration));
  const previous = Math.max(0, start - 1);
  const following = Math.min(shots.length - 1, end + 1);
  // Monotone tangents prevent overshoot and keep held camera poses stationary.
  const interpolate = (key: "camera" | "target"): Point =>
    shots[start][key].map((value, i) => {
      const next = shots[end][key][i];
      const slope = (next - value) / duration;
      const tangent = (
        before: number,
        after: number,
        beforeTime: number,
        afterTime: number,
      ) => {
        if (before * after <= 0) return 0;
        const firstWeight = 2 * afterTime + beforeTime;
        const secondWeight = afterTime + 2 * beforeTime;
        return (
          (firstWeight + secondWeight) /
          (firstWeight / before + secondWeight / after)
        );
      };
      const outgoing =
        start === 0
          ? 0
          : tangent(
              (value - shots[previous][key][i]) /
                (shots[start].at - shots[previous].at),
              slope,
              shots[start].at - shots[previous].at,
              duration,
            ) * duration;
      const incoming =
        end === shots.length - 1
          ? 0
          : tangent(
              slope,
              (shots[following][key][i] - next) /
                (shots[following].at - shots[end].at),
              duration,
              shots[following].at - shots[end].at,
            ) * duration;
      return (
        (2 * t ** 3 - 3 * t ** 2 + 1) * value +
        (t ** 3 - 2 * t ** 2 + t) * outgoing +
        (-2 * t ** 3 + 3 * t ** 2) * next +
        (t ** 3 - t ** 2) * incoming
      );
    }) as Point;
  const camera = interpolate("camera");
  const target = interpolate("target");
  if (mobile) {
    camera[0] *= 0.65 + 0.35 * smoothRange(p, 0.12, 0.18);
    target[1] -= 1.6 * (1 - smoothRange(p, 0.08, 0.18));
    camera[0] *= 1 - smoothRange(p, 0.34, 0.42);
    target[0] *= 1 - smoothRange(p, 0.34, 0.42);
  }
  return {
    camera,
    target,
    fov: mobile ? 68 : 56,
    open: smoothRange(p, 0.1, 0.2),
    rearOpen: smoothRange(p, 0.286, 0.318),
    roomVisible: p >= 0.28,
    fullScreen: smoothRange(p, 0.14, 0.22),
    coreOpen: smoothRange(p, 0.65, 0.78),
    phase:
      p < 0.1
        ? "arrival"
        : p < 0.28
          ? "enclosure"
          : p < 0.42
            ? "immersion"
            : p < 0.64
              ? "workshop"
              : p < 0.8
                ? "kevin"
                : "modules",
  };
}
