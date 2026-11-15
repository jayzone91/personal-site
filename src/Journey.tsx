import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sampleJourney, smoothRange, type JourneyState } from "./cameraPath";

const Machine = lazy(() => import("./Machine"));

export default function Journey({
  children,
  reduced,
  breakfast,
  selected,
  onMotion,
}: {
  children: ReactNode;
  reduced: boolean;
  breakfast: boolean;
  selected: number | null;
  onMotion: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const state = useRef<JourneyState>({ progress: 0, phase: "arrival" });
  const [webgl, setWebgl] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (root.current)
        root.current.dataset.visible = String(entry.isIntersecting);
    });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    try {
      const probe = document.createElement("canvas");
      const context = probe.getContext("webgl2");
      setWebgl(!!context);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setWebgl(false);
    }
  }, []);
  useEffect(() => {
    const element = root.current!;
    const update = (progress: number) => {
      state.current.progress = progress;
      element.dataset.phase = sampleJourney(progress, false, reduced).phase;
      element.style.setProperty(
        "--journey-dark",
        String(reduced ? 0 : smoothRange(progress, 0.25, 0.4)),
      );
      element.style.setProperty("--journey-progress", String(progress));
    };
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    update(trigger.progress);
    return () => trigger.kill();
  }, [reduced]);
  return (
    <div
      ref={root}
      className={`journey ${webgl ? "has-webgl" : "no-webgl"} ${reduced ? "quiet-journey" : ""}`}
      data-phase="arrival"
    >
      <div className="journey-stage">
        <div className="journey-atmosphere" />
        <div className="world-fallback" aria-hidden="true">
          <span className="fallback-label">KEVIN / WERKSTATT</span>
          <div className="fallback-case">
            {["CRM", "TERMINE", "SUPPORT", "WIKI", "LIZENZEN", "CMS"].map(
              (name) => (
                <span key={name}>
                  {name}
                  <i />
                  <i />
                </span>
              ),
            )}
          </div>
        </div>
        {webgl && (
          <Suspense fallback={null}>
            <Machine
              state={state}
              reduced={reduced}
              breakfast={breakfast}
              selected={selected}
              onFailure={() => setWebgl(false)}
            />
          </Suspense>
        )}
        <div className="journey-shade" />
        <div className="journey-track" aria-hidden="true">
          <i />
        </div>
      </div>
      <div className="journey-tools">
        <button aria-pressed={reduced} onClick={onMotion}>
          Bewegung {reduced ? "reduziert" : "an"} ↔
        </button>
        <a href="#kevin">Direkt zu KEVIN ↓</a>
      </div>
      <div className="journey-legal">
        <Link to="/impressum">Impressum</Link>
        <Link to="/datenschutz">Datenschutz</Link>
      </div>
      {children}
    </div>
  );
}
