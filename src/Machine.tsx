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
import { sampleJourney, type JourneyState } from "./cameraPath";

const orange = "#ff5025";
const graphite = "#242b2b";
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
}: {
  text: string;
  position: [number, number, number];
  width?: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 112;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#eeece2";
    context.fillRect(0, 0, 512, 112);
    context.fillStyle = "#242b2b";
    context.font = "bold 31px monospace";
    context.fillText(text, 20, 46);
    for (let i = 0; i < 55; i++)
      context.fillRect(20 + i * 8, 66, (i % 3) + 2, 25);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position}>
      <planeGeometry args={[width, (width * 112) / 512]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function Metal({
  size,
  position = [0, 0, 0],
  color = graphite,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  color?: string;
}) {
  return (
    <RoundedBox
      args={size}
      position={position}
      radius={Math.min(0.045, ...size.map((value) => value * 0.2))}
      smoothness={2}
    >
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.43} />
    </RoundedBox>
  );
}

function Cable({
  points,
  color = orange,
  radius = 0.035,
}: {
  points: [number, number, number][];
  color?: string;
  radius?: number;
}) {
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        40,
        radius,
        6,
        false,
      ),
    [points, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
    </mesh>
  );
}

const route: [number, number, number][] = [
  [0, -1.1, 0],
  [1.4, -1.6, -2],
  [3, -2.5, -4],
  [2.3, -2.5, -8],
  [-1.6, -2.5, -10],
  [0, -2.4, -13],
];
const branches: [number, number, number][][] = [-1, 1].flatMap((side) =>
  [0, 1, 2].map(
    (i) =>
      [
        [0, -2.45, -6 - i * 2.8],
        [side * 2, -2.45, -6 - i * 2.8],
        [side * 4.5, -2.45, -6 - i * 2.8],
      ] as [number, number, number][],
  ),
);
const moduleRoutes: [number, number, number][][] = moduleNames.map((_, i) => {
  const side = i % 2 === 0 ? -1 : 1;
  const y = 1.55 - Math.floor(i / 2) * 1.55;
  return [
    [0, y, 0.5],
    [side * 1.3, y - 0.25, 1.1],
    [side * 2.8, y, 3.1],
  ];
});

function Rack({
  position,
  index,
}: {
  position: [number, number, number];
  index: number;
}) {
  return (
    <group position={position}>
      <Metal size={[1.75, 3.7, 1.35]} color="#333c3a" />
      <Metal size={[1.54, 3.45, 0.1]} position={[0, 0, 0.73]} color="#151c1c" />
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[0, 1.32 - i * 0.52, 0.83]}>
          <Metal
            size={[1.37, 0.4, 0.14]}
            color={i === 0 ? orange : "#56605b"}
          />
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[-0.5 + j * 0.13, 0, 0.09]}>
              <sphereGeometry args={[0.027, 6, 6]} />
              <meshBasicMaterial color={j === 0 ? "#c8f58d" : "#829d94"} />
            </mesh>
          ))}
          <Metal
            size={[0.45, 0.035, 0.02]}
            position={[0.3, 0, 0.09]}
            color="#1b2423"
          />
        </group>
      ))}
      <Label
        text={["ERSTER PC", "WERKSTATT", "ENTWICKLUNG", "SYSTEME"][index % 4]}
        position={[0, 1.95, 0.8]}
        width={1.6}
      />
    </group>
  );
}

function Workshop({
  state,
  reduced,
  breakfast,
  selected,
}: {
  state: RefObject<JourneyState>;
  reduced: boolean;
  breakfast: boolean;
  selected: number | null;
}) {
  const shell = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const world = useRef<THREE.Group>(null);
  const doorLeft = useRef<THREE.Group>(null);
  const doorRight = useRef<THREE.Group>(null);
  const modules = useRef<(THREE.Group | null)[]>([]);
  const connections = useRef<THREE.Group>(null);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const { camera, size, invalidate } = useThree();
  const path = useMemo(
    () => new THREE.CatmullRomCurve3(route.map((p) => new THREE.Vector3(...p))),
    [],
  );
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const packetPosition = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    invalidate();
  }, [reduced, breakfast, selected, invalidate]);
  useFrame(({ clock, pointer }) => {
    const p = state.current.progress;
    const frame = sampleJourney(p, size.width < 700, reduced);
    camera.position.set(...frame.camera);
    lookAt.set(...frame.target);
    camera.lookAt(lookAt);
    if (shell.current) {
      shell.current.visible = p < 0.4 && !reduced;
      shell.current.rotation.set(
        -0.12 * (1 - frame.enter),
        -0.28 * (1 - frame.enter),
        -0.1 * (1 - frame.enter),
      );
      if (!reduced && p < 0.12) {
        shell.current.rotation.y += pointer.x * 0.07;
        shell.current.rotation.x += pointer.y * 0.04;
      }
    }
    if (lid.current) lid.current.rotation.x = -frame.open * Math.PI * 0.86;
    if (world.current) world.current.scale.setScalar(0.09 + frame.enter * 0.91);
    if (doorLeft.current) doorLeft.current.rotation.y = -frame.coreOpen * 2.05;
    if (doorRight.current) doorRight.current.rotation.y = frame.coreOpen * 2.05;
    if (connections.current) {
      connections.current.scale.x = 0.1 + frame.spread * 0.9;
      connections.current.visible = frame.spread > 0.03;
    }
    modules.current.forEach((module, i) => {
      if (!module) return;
      const side = i % 2 === 0 ? -1 : 1;
      module.position.set(
        side * (0.64 + frame.spread * 2.2),
        1.55 - Math.floor(i / 2) * 1.55,
        0.4 + frame.spread * 2.7 + (selected === i ? 0.32 : 0),
      );
      module.rotation.y = side * frame.spread * -0.12;
      module.scale.setScalar(selected === i ? 1.08 : 1);
    });
    packets.current.forEach((packet, i) => {
      if (!packet) return;
      path.getPointAt(
        (i / 8 + (reduced ? 0 : clock.elapsedTime * 0.065)) % 1,
        packetPosition,
      );
      packet.position.copy(packetPosition);
      packet.rotation.set(
        0,
        clock.elapsedTime * (reduced ? 0 : 0.5),
        breakfast ? -0.3 : 0,
      );
    });
    state.current.phase = frame.phase;
  });
  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[4, 8, 9]} intensity={4.2} color="#fff2dc" />
      <directionalLight position={[-7, 3, -6]} intensity={3} color="#b2dfff" />
      <pointLight
        position={[0, 2, -10]}
        intensity={24}
        color={orange}
        distance={16}
      />
      <group ref={shell}>
        <Metal size={[4.2, 0.17, 2.5]} position={[0, -1.3, 0]} color={orange} />
        <Metal
          size={[0.16, 2.6, 2.5]}
          position={[-2.02, 0, 0]}
          color={orange}
        />
        <Metal size={[0.16, 2.6, 2.5]} position={[2.02, 0, 0]} color={orange} />
        <Metal size={[4.2, 0.16, 2.5]} position={[0, 1.3, 0]} color={orange} />
        <Metal size={[4, 2.45, 0.12]} position={[0, 0, -1.2]} color="#152724" />
        <group ref={lid} position={[0, 1.3, 1.3]}>
          <Metal
            size={[4.2, 2.6, 0.2]}
            position={[0, -1.3, 0]}
            color={orange}
          />
          <Metal size={[3.8, 2.2, 0.12]} position={[0, -1.3, 0.14]} />
          <Metal
            size={[1.5, 1.35, 0.1]}
            position={[-0.9, -1.15, 0.24]}
            color="#acc2b1"
          />
          {[0, 1, 2, 3].map((i) => (
            <Metal
              key={i}
              size={[0.9 - i * 0.09, 0.045, 0.02]}
              position={[-0.9, -0.8 - i * 0.21, 0.3]}
              color="#35584a"
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <Metal
              key={i}
              size={[0.85, 0.055, 0.08]}
              position={[0.9, -0.65 - i * 0.21, 0.25]}
              color="#69756c"
            />
          ))}
          <Label
            text="IMMER AM WERK."
            position={[0.35, -2.04, 0.25]}
            width={1.8}
          />
          <mesh position={[1.43, -1.8, 0.25]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#c8f58d" />
          </mesh>
        </group>
      </group>
      <group ref={world}>
        <Metal size={[15, 0.2, 18]} position={[0, -2.7, -7]} color="#38433e" />
        <gridHelper
          args={[18, 24, "#6d796b", "#46534b"]}
          position={[0, -2.58, -7]}
        />
        <Cable points={route} radius={0.065} />
        {branches.map((points, i) => (
          <Cable key={i} points={points} color={i % 2 ? "#90cbd8" : orange} />
        ))}
        {[-1, 1].flatMap((side) =>
          [0, 1, 2].map((i) => (
            <Rack
              key={`${side}-${i}`}
              position={[side * 4.5, -0.7, -5 - i * 3.4]}
              index={i + (side > 0 ? 1 : 0)}
            />
          )),
        )}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh
            key={`${breakfast}-${i}`}
            ref={(node) => {
              packets.current[i] = node;
            }}
          >
            {breakfast ? (
              <capsuleGeometry args={[0.12, 0.16, 3, 8]} />
            ) : (
              <boxGeometry args={[0.12, 0.12, 0.24]} />
            )}
            <meshStandardMaterial
              color={breakfast ? "#e9aa59" : "#c5f8ff"}
              emissive={breakfast ? "#9d5b22" : "#9deaff"}
              emissiveIntensity={breakfast ? 0.2 : 1.5}
            />
          </mesh>
        ))}
        <group position={[0, 0, -13]}>
          <Metal
            size={[3.5, 0.18, 2.25]}
            position={[0, -2.5, 0]}
            color={orange}
          />
          <Metal
            size={[3.5, 0.18, 2.25]}
            position={[0, 2.5, 0]}
            color={orange}
          />
          {[-1, 1].map((side) => (
            <Metal
              key={side}
              size={[0.16, 5, 2.25]}
              position={[side * 1.7, 0, 0]}
              color={orange}
            />
          ))}
          <Metal
            size={[3.35, 4.9, 0.12]}
            position={[0, 0, -1.05]}
            color="#182e2c"
          />
          <Label text="KEVIN / CORE" position={[0, 2.53, 1.16]} width={2.7} />
          <group ref={connections}>
            {moduleRoutes.map((points, i) => (
              <Cable
                points={points}
                key={i}
                color={i % 2 ? "#91d6e4" : orange}
                radius={0.045}
              />
            ))}
          </group>
          {moduleNames.map((name, i) => (
            <group
              key={name}
              ref={(node) => {
                modules.current[i] = node;
              }}
            >
              <Metal
                size={[1.18, 1.16, 0.9]}
                color={selected === i ? orange : "#566f65"}
              />
              <Metal
                size={[1.04, 0.84, 0.06]}
                position={[0, 0.08, 0.48]}
                color="#1b2c2a"
              />
              <Label text={name} position={[0, -0.32, 0.52]} width={1.05} />
              {[0, 1, 2].map((j) => (
                <Metal
                  key={j}
                  size={[0.55 + j * 0.07, 0.045, 0.02]}
                  position={[-0.05, 0.3 - j * 0.14, 0.53]}
                  color={i % 2 ? "#9cc9c9" : "#d5efbb"}
                />
              ))}
            </group>
          ))}
          <group ref={doorLeft} position={[-1.72, 0, 1.17]}>
            <Metal
              size={[1.7, 4.86, 0.12]}
              position={[0.86, 0, 0]}
              color="#313a35"
            />
            <Label text="KE" position={[0.86, 0.15, 0.08]} width={1.3} />
          </group>
          <group ref={doorRight} position={[1.72, 0, 1.17]}>
            <Metal
              size={[1.7, 4.86, 0.12]}
              position={[-0.86, 0, 0]}
              color="#313a35"
            />
            <Label text="VIN" position={[-0.86, 0.15, 0.08]} width={1.3} />
          </group>
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
}: {
  state: RefObject<JourneyState>;
  reduced: boolean;
  breakfast: boolean;
  selected: number | null;
  onFailure: () => void;
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
    <div className="world-canvas" ref={container}>
      <SceneBoundary onFailure={onFailure}>
        <Canvas
          frameloop={active && !reduced ? "always" : "demand"}
          dpr={[1, window.innerWidth < 700 ? 1.25 : 1.5]}
          camera={{ position: [0, 1.1, 10], fov: 40, near: 0.05, far: 90 }}
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
          />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
