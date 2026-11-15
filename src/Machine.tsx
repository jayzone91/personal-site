import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import {
  sampleJourney,
  smoothRange,
  type JourneyState,
  type Point,
} from "./cameraPath";

const orange = "#ed6337";
const graphite = "#272e32";
const moduleNames = [
  "KUNDEN / CRM",
  "TERMINE",
  "TICKETS / SUPPORT",
  "WIKI / WISSEN",
  "LIZENZEN",
  "CMS / SYSTEME",
];

function Label({
  text,
  position,
  width = 1.4,
  barcode = false,
}: {
  text: string;
  position: Point;
  width?: number;
  barcode?: boolean;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 192;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#eeece2";
    context.fillRect(0, 0, 1024, 192);
    context.fillStyle = "#e6643b";
    context.fillRect(0, 0, 16, 192);
    context.fillStyle = "#262e31";
    context.font = "600 64px monospace";
    const textWidth = context.measureText(text).width;
    if (textWidth > 930)
      context.font = `600 ${Math.floor((64 * 930) / textWidth)}px monospace`;
    context.fillText(text, 42, barcode ? 90 : 119);
    if (barcode)
      for (let i = 0; i < 90; i++)
        context.fillRect(42 + i * 10, 124, (i % 3) + 2, 28);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, [text, barcode]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position}>
      <planeGeometry args={[width, (width * 192) / 1024]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function Metal({
  size,
  position = [0, 0, 0],
  color = graphite,
}: {
  size: Point;
  position?: Point;
  color?: string;
}) {
  return (
    <RoundedBox
      args={size}
      position={position}
      radius={Math.min(0.065, ...size.map((value) => value * 0.2))}
      smoothness={3}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} metalness={0.32} roughness={0.69} />
    </RoundedBox>
  );
}

function Fastener({ position }: { position: Point }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.033, 0.033, 0.02, 8]} />
        <meshStandardMaterial color="#9aabad" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.014]}>
        <boxGeometry args={[0.035, 0.007, 0.004]} />
        <meshBasicMaterial color="#354349" />
      </mesh>
    </group>
  );
}

function Cable({
  points,
  color = orange,
  radius = 0.03,
}: {
  points: Point[];
  color?: string;
  radius?: number;
}) {
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          points.map((point) => new THREE.Vector3(...point)),
        ),
        56,
        radius,
        8,
        false,
      ),
    [points, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.78} metalness={0.05} />
    </mesh>
  );
}

const route: Point[] = [
  [0.8, -2.54, -1.1],
  [0.8, -2.54, -3],
  [1.5, -2.54, -7],
  [0.8, -2.54, -10],
  [0, -2.4, -11.9],
];
const branches: Point[][] = [-1, 1].flatMap((side) =>
  [0, 1].map(
    (i) =>
      [
        [0.8, -2.54, -10 - i * 4],
        [side * 2.7, -2.54, -10 - i * 4],
        [side * 4.7, -2.54, -10 - i * 4],
      ] as Point[],
  ),
);

function Rack({ position, index }: { position: Point; index: number }) {
  return (
    <group position={position}>
      <Metal size={[1.8, 3.8, 1.4]} color="#313b40" />
      <Metal size={[1.6, 3.54, 0.08]} position={[0, 0, 0.74]} color="#151d21" />
      {[-1, 1].map((side) => (
        <Metal
          key={side}
          size={[0.08, 3.6, 0.07]}
          position={[side * 0.79, 0, 0.82]}
          color="#8b999d"
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[0, 1.37 - i * 0.54, 0.84]}>
          <Metal
            size={[1.4, 0.45, 0.13]}
            color={i === 0 ? "#bb6448" : "#3d4b51"}
          />
          <Metal
            size={[0.53, 0.055, 0.06]}
            position={[0.22, 0, 0.1]}
            color="#a5afb0"
          />
          {[0, 1, 2, 3].map((j) => (
            <mesh key={j} position={[-0.51 + j * 0.12, -0.04, 0.08]}>
              <boxGeometry args={[0.034, 0.09, 0.012]} />
              <meshStandardMaterial
                color={j === 0 ? "#b2deb8" : "#18252a"}
                emissive={j === 0 ? "#78aa81" : "#000000"}
                emissiveIntensity={0.4}
              />
            </mesh>
          ))}
        </group>
      ))}
      <Label
        text={["WERKSTATT", "ENTWICKLUNG", "SYSTEME", "EXPERIMENTE"][index]}
        position={[0, 2.04, 0.8]}
        width={1.65}
      />
      {[-1, 1].map((side) => (
        <Metal
          key={side}
          size={[0.27, 0.15, 1]}
          position={[side * 0.6, -1.98, 0]}
          color="#141c20"
        />
      ))}
    </group>
  );
}

function RackUnit({
  name,
  index,
  active,
}: {
  name: string;
  index: number;
  active: boolean;
}) {
  return (
    <group position={[0, 1.85 - index * 0.74, 0]}>
      <Metal size={[3.08, 0.62, 1.55]} color={active ? "#596255" : "#384b55"} />
      <Metal size={[2.94, 0.52, 0.04]} position={[0, 0, 0.8]} color="#1c2b33" />
      <Label text={name} position={[-0.3, 0, 0.83]} width={1.65} />
      {[-1, 1].map((side) => (
        <Metal
          key={side}
          size={[0.08, 0.36, 0.07]}
          position={[side * 1.32, 0, 0.86]}
          color="#9cabb0"
        />
      ))}
      <mesh position={[-1.14, 0.1, 0.84]}>
        <circleGeometry args={[0.032, 12]} />
        <meshStandardMaterial
          color={active ? orange : "#a8d1b0"}
          emissive={active ? orange : "#78aa81"}
          emissiveIntensity={active ? 1.3 : 0.3}
        />
      </mesh>
      {Array.from({ length: 6 }, (_, slot) => (
        <mesh key={slot} position={[0.65 + slot * 0.08, 0, 0.83]}>
          <boxGeometry args={[0.025, 0.2, 0.012]} />
          <meshBasicMaterial color="#637d88" />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <Fastener key={side} position={[side * 1.49, 0, 0.83]} />
      ))}
    </group>
  );
}
function Workshop({
  state,
  reduced,
  breakfast,
  selected,
  onRoomReady,
}: {
  state: RefObject<JourneyState>;
  reduced: boolean;
  breakfast: boolean;
  selected: number | null;
  onRoomReady: (ready: boolean) => void;
}) {
  const shell = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const rearDoors = useRef<(THREE.Group | null)[]>([]);
  const world = useRef<THREE.Group>(null);
  const doors = useRef<(THREE.Group | null)[]>([]);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const progress = useRef(state.current.progress);
  const roomReady = useRef(false);
  const { camera, size, invalidate } = useThree();
  const path = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        route.map((point) => new THREE.Vector3(...point)),
      ),
    [],
  );
  const target = useMemo(() => new THREE.Vector3(), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    invalidate();
  }, [reduced, breakfast, selected, invalidate]);
  useFrame(({ clock, pointer }, delta) => {
    progress.current = reduced
      ? 0.95
      : THREE.MathUtils.damp(
          progress.current,
          state.current.progress,
          14,
          Math.min(delta, 0.05),
        );
    const mobile = window.innerWidth <= 900;
    const wideMobile = mobile && size.width / size.height >= 1.15;
    const frame = sampleJourney(progress.current, mobile, reduced);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = frame.fov;
      const offset = reduced
        ? 0
        : mobile
          ? (wideMobile ? -0.25 * size.width : 0) *
            (1 - smoothRange(progress.current, 0.08, 0.18))
          : -0.22 *
            size.width *
            (1 - smoothRange(progress.current, 0.08, 0.18));
      camera.setViewOffset(
        size.width,
        size.height,
        offset,
        mobile && !wideMobile && !reduced
          ? -(
              Math.max(size.height * 0.58, 350 + size.height * 0.13) -
              size.height / 2
            ) *
              (1 - smoothRange(progress.current, 0.08, 0.18))
          : 0,
        size.width,
        size.height,
      );
    }
    const ready = reduced || progress.current >= 0.42;
    if (roomReady.current !== ready) {
      roomReady.current = ready;
      onRoomReady(ready);
    }
    target.set(...frame.target);
    const outsideFit = Math.max(
      mobile && !wideMobile ? 1.25 : 1,
      0.4 / (size.width / size.height),
    );
    const fit =
      1 + (outsideFit - 1) * (1 - smoothRange(progress.current, 0.14, 0.22));
    camera.position
      .set(...frame.camera)
      .sub(target)
      .multiplyScalar(fit)
      .add(target);
    camera.lookAt(target);
    if (shell.current) {
      const align = 1 - smoothRange(progress.current, 0.08, 0.18);
      const parallax = reduced ? 0 : align;
      shell.current.rotation.set(
        -0.05 * align + pointer.y * 0.035 * parallax,
        -0.15 * align + pointer.x * 0.045 * parallax,
        -0.04 * align,
      );
    }
    if (lid.current) lid.current.rotation.y = -frame.open * Math.PI * 0.62;
    rearDoors.current.forEach((door, i) => {
      if (door) door.rotation.y = (i === 0 ? 1 : -1) * frame.rearOpen * 2.4;
    });
    if (world.current) world.current.visible = frame.roomVisible;
    doors.current.forEach((door, i) => {
      if (door) door.rotation.y = (i === 0 ? -1 : 1) * frame.coreOpen * 2.3;
    });
    packets.current.forEach((packet, i) => {
      if (!packet) return;
      path.getPointAt(
        (i / 7 + (reduced ? 0 : clock.elapsedTime * 0.035)) % 1,
        point,
      );
      packet.position.copy(point);
      packet.position.y += 0.065;
      packet.rotation.z = breakfast ? 0.3 : 0;
    });
  });
  return (
    <>
      <ambientLight intensity={1.2} color="#f1f0e9" />
      <directionalLight
        position={[4, 9, 12]}
        intensity={3.2}
        color="#fff3df"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={10}
        shadow-camera-bottom={-20}
        shadow-camera-far={60}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-8, 4, -8]} intensity={2} color="#c1daeb" />
      <group ref={shell}>
        <Metal size={[3.95, 0.16, 3.15]} position={[0, -2.65, 0]} />
        <Metal
          size={[3.95, 0.16, 3.15]}
          position={[0, 2.65, 0]}
          color={orange}
        />
        {[-1, 1].map((side) => (
          <group key={side}>
            <Metal
              size={[0.16, 5.3, 3.15]}
              position={[side * 1.9, 0, 0]}
              color="#3b474e"
            />
            <Metal
              size={[0.09, 4.8, 0.14]}
              position={[side * 1.76, 0, 1.34]}
              color={orange}
            />
            <Metal
              size={[0.3, 0.22, 2.3]}
              position={[side * 1.35, -2.84, 0]}
              color="#172129"
            />
          </group>
        ))}
        {[-1, 1].map((side, index) => (
          <group
            key={side}
            ref={(node) => {
              rearDoors.current[index] = node;
            }}
            position={[side * 1.9, 0, -1.5]}
          >
            <Metal
              size={[1.9, 5.14, 0.17]}
              position={[-side * 0.95, 0, 0]}
              color="#283840"
            />
            <Metal
              size={[1.65, 4.5, 0.055]}
              position={[-side * 0.95, 0, 0.12]}
              color="#344c55"
            />
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <Metal
                key={row}
                size={[1.2, 0.035, 0.03]}
                position={[-side * 0.95, 1.8 - row * 0.6, 0.17]}
                color="#536b73"
              />
            ))}
            <Metal
              size={[0.12, 0.6, 0.1]}
              position={[-side * 1.65, 0, 0.18]}
              color="#a8b6b9"
            />
          </group>
        ))}
        {[-1.95, -1.29, 1.29, 1.95].map((y, row) => (
          <group key={row} position={[0, y, 1.18]}>
            <Metal
              size={[3.42, 0.57, 2.4]}
              position={[0, 0, -1.18]}
              color="#2b3d45"
            />
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 0.8, 0, 0]}>
                <Metal size={[1.45, 0.53, 0.16]} color="#19262e" />
                <Metal
                  size={[0.64, 0.065, 0.08]}
                  position={[0.12, 0, 0.12]}
                  color="#889ca5"
                />
                <Metal
                  size={[0.08, 0.31, 0.05]}
                  position={[-0.53, 0, 0.11]}
                  color={row === 0 ? orange : "#546b76"}
                />
                <mesh position={[-0.36, 0.1, 0.105]}>
                  <circleGeometry args={[0.026, 10]} />
                  <meshBasicMaterial color="#a7d9b7" />
                </mesh>
                {[0, 1, 2].map((slot) => (
                  <mesh key={slot} position={[-0.13 + slot * 0.16, -0.15, 0.1]}>
                    <boxGeometry args={[0.075, 0.022, 0.01]} />
                    <meshBasicMaterial color="#5b7480" />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        ))}
        <group ref={lid} position={[-1.9, 0, 1.65]}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Metal
                size={[0.1, 5.25, 0.16]}
                position={[1.9 + side * 1.85, 0, 0]}
                color="#202d35"
              />
              <Metal
                size={[3.8, 0.44, 0.16]}
                position={[1.9, side * 2.4, 0]}
                color="#202d35"
              />
            </group>
          ))}
          {Array.from({ length: 17 }, (_, i) => (
            <mesh key={`vertical-${i}`} position={[0.3 + i * 0.2, 0, 0.04]}>
              <boxGeometry args={[0.012, 4.4, 0.018]} />
              <meshStandardMaterial
                color="#68808b"
                metalness={0.65}
                roughness={0.6}
              />
            </mesh>
          ))}
          {Array.from({ length: 23 }, (_, i) => (
            <mesh
              key={`horizontal-${i}`}
              position={[1.9, -2.2 + i * 0.2, 0.045]}
            >
              <boxGeometry args={[3.5, 0.012, 0.018]} />
              <meshStandardMaterial
                color="#68808b"
                metalness={0.65}
                roughness={0.6}
              />
            </mesh>
          ))}
          <Metal
            size={[0.07, 0.62, 0.1]}
            position={[3.58, 0, 0.15]}
            color="#bac6c9"
          />
          <Label
            text="JK / WERKSTATT"
            position={[1.9, 2.22, 0.16]}
            width={2.8}
          />
          <Label
            text="IMMER AM WEITERBAUEN"
            position={[1.9, -2.25, 0.16]}
            width={2.8}
          />
          {[-1, 1].flatMap((x) =>
            [-1, 1].map((y) => (
              <Fastener
                key={`${x}-${y}`}
                position={[1.9 + x * 1.69, y * 2.38, 0.17]}
              />
            )),
          )}
        </group>
      </group>
      {[-5, -13, -21, -29, -37].map((z) => (
        <pointLight
          key={`room-light-${z}`}
          position={[0, 4.93, z]}
          color="#b7d7e7"
          intensity={16}
          distance={16}
          decay={2}
        />
      ))}
      <pointLight
        position={[0, 1, -10]}
        intensity={6}
        color="#d1e2ec"
        distance={8}
      />
      <group ref={world} scale={1}>
        <Metal
          size={[24, 0.18, 42.2]}
          position={[0, -2.74, -22.9]}
          color="#2d393e"
        />
        <gridHelper
          args={[52, 64, "#53666a", "#3c4c51"]}
          position={[0, -2.64, -18]}
        />
        {[-1, 1].map((side) => (
          <Metal
            key={side}
            size={[0.25, 8.1, 42.2]}
            position={[side * 12, 1.3, -22.9]}
            color="#263b45"
          />
        ))}
        <Metal
          size={[24, 8.1, 0.25]}
          position={[0, 1.3, -44]}
          color="#21343e"
        />
        <Metal
          size={[24, 0.2, 42.2]}
          position={[0, 5.4, -22.9]}
          color="#1e303a"
        />
        {[-5, -13, -21, -29, -37].map((z) => (
          <group key={z} position={[0, 5.23, z]}>
            <mesh>
              <boxGeometry args={[10, 0.05, 0.22]} />
              <meshStandardMaterial
                color="#d8e9ed"
                emissive="#bddce9"
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>
        ))}
        <Cable points={route} radius={0.045} />
        {branches.map((points, i) => (
          <Cable
            key={i}
            points={points}
            color={i % 2 ? "#7eafc0" : orange}
            radius={0.025}
          />
        ))}
        {[-1, 1].flatMap((side, sideIndex) =>
          [0, 1].map((i) => (
            <Rack
              key={`${side}-${i}`}
              position={[side * 4.7, -0.65, -10 - i * 4]}
              index={i + sideIndex * 2}
            />
          )),
        )}
        {Array.from({ length: 7 }, (_, i) => (
          <mesh
            key={`${breakfast}-${i}`}
            ref={(node) => {
              packets.current[i] = node;
            }}
          >
            {breakfast ? (
              <capsuleGeometry args={[0.09, 0.13, 4, 10]} />
            ) : (
              <sphereGeometry args={[0.045, 8, 8]} />
            )}
            <meshStandardMaterial
              color={breakfast ? "#e8b578" : "#a7d5e2"}
              emissive={breakfast ? "#000000" : "#76a9b9"}
              emissiveIntensity={0.5}
              roughness={0.8}
            />
          </mesh>
        ))}
        <group position={[0, 0, -13]}>
          <Metal
            size={[3.55, 5.2, 0.14]}
            position={[0, 0, -0.93]}
            color="#344650"
          />
          <Metal
            size={[3.55, 0.15, 1.9]}
            position={[0, -2.6, 0]}
            color="#414c50"
          />
          {[-1, 1].map((side) => (
            <Metal
              key={side}
              size={[0.14, 5.2, 1.9]}
              position={[side * 1.7, 0, 0]}
              color="#414c50"
            />
          ))}
          {[-1, 1].map((side) => (
            <Metal
              key={side}
              size={[0.12, 5, 0.15]}
              position={[side * 1.65, 0, 1.13]}
              color={orange}
            />
          ))}
          <Metal size={[3.55, 0.15, 2]} position={[0, 2.6, 0]} color={orange} />
          <Label
            text="KEVIN / INTRANET"
            position={[0, 2.66, 1.09]}
            width={2.9}
          />
          {[-1, 1].map((side) => (
            <Metal
              key={side}
              size={[0.09, 4.9, 0.08]}
              position={[side * 1.58, 0, 0.82]}
              color="#71828a"
            />
          ))}
          {moduleNames.map((name, index) => (
            <RackUnit
              key={name}
              name={name}
              index={index}
              active={selected === index}
            />
          ))}
          {[-1, 1].map((side, i) => (
            <group
              key={side}
              ref={(node) => {
                doors.current[i] = node;
              }}
              position={[side * 1.7, 0, 1.2]}
            >
              <Metal
                size={[1.68, 4.96, 0.12]}
                position={[-side * 0.84, 0, 0]}
                color="#2b363c"
              />
              <Metal
                size={[1.44, 4.6, 0.035]}
                position={[-side * 0.84, 0, 0.08]}
                color="#35444a"
              />
              {Array.from({ length: 13 }, (_, row) => (
                <mesh
                  key={row}
                  position={[-side * 0.84, 1.93 - row * 0.32, 0.105]}
                >
                  <boxGeometry args={[1.14, 0.025, 0.012]} />
                  <meshStandardMaterial color="#1b282e" roughness={1} />
                </mesh>
              ))}
              <Metal
                size={[0.055, 0.55, 0.1]}
                position={[-side * 1.45, 0, 0.14]}
                color="#9ba9aa"
              />
            </group>
          ))}
        </group>
      </group>
    </>
  );
}

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Machine({
  state,
  reduced,
  breakfast,
  selected,
  onFailure,
  onRoomReady,
}: {
  state: RefObject<JourneyState>;
  reduced: boolean;
  breakfast: boolean;
  selected: number | null;
  onFailure: () => void;
  onRoomReady: (ready: boolean) => void;
}) {
  const [active, setActive] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let intersects = true;
    const update = () => setActive(intersects && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      intersects = entry.isIntersecting;
      update();
    });
    if (container.current) observer.observe(container.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div className="world-canvas" ref={container} aria-hidden="true">
      <SceneBoundary onFailure={onFailure}>
        <Canvas
          shadows
          frameloop={active && !reduced ? "always" : "demand"}
          dpr={[1, window.innerWidth < 700 ? 1.25 : 1.5]}
          camera={{ position: [4.5, 3.1, 12.8], fov: 40, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", onFailure, {
              once: true,
            });
          }}
        >
          <Workshop
            state={state}
            reduced={reduced}
            breakfast={breakfast}
            selected={selected}
            onRoomReady={onRoomReady}
          />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
