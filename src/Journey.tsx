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
  const state = useRef<JourneyState>({ progress: 0 });
  const [webgl, setWebgl] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (root.current)
        root.current.dataset.visible = String(entry.isIntersecting);
    });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!webgl || !window.location.hash) return;
    // The immersion spacer enters the layout after WebGL detection.
    // Resolve the initial hash again against that final layout.
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      try {
        document
          .getElementById(decodeURIComponent(window.location.hash.slice(1)))
          ?.scrollIntoView({ behavior: "instant" });
      } catch {
        // Ignore malformed URL fragments.
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [webgl]);
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
    let landmarks: { scroll: number; progress: number }[] = [];
    const measure = () => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      const anchor = (selector: string, offset: number, progress: number) => ({
        scroll:
          element.querySelector(selector)!.getBoundingClientRect().top +
          window.scrollY -
          top -
          window.innerHeight * offset,
        progress,
      });
      landmarks = [
        { scroll: 0, progress: 0 },
        anchor(".enclosure-chapter", 0.15, 0.1),
        anchor(".immersion", 0, 0.18),
        anchor(".immersion", -1, 0.3),
        anchor(".immersion", -2, 0.4),
        anchor(".about", 0.15, 0.46),
        anchor(".core-approach", 0.15, 0.64),
        anchor(".kevin", 0.15, 0.8),
        anchor(".module-board", 0.2, 0.93),
        { scroll: element.offsetHeight - window.innerHeight, progress: 1 },
      ].sort((a, b) => a.scroll - b.scroll);
    };
    const update = (rawProgress: number) => {
      const scroll = rawProgress * (element.offsetHeight - window.innerHeight);
      const next = landmarks.findIndex((mark) => mark.scroll >= scroll);
      const end = next < 0 ? landmarks.length - 1 : Math.max(1, next);
      const from = landmarks[end - 1];
      const to = landmarks[end];
      const blend = Math.max(
        0,
        Math.min(
          1,
          (scroll - from.scroll) / Math.max(1, to.scroll - from.scroll),
        ),
      );
      const sceneProgress =
        from.progress + (to.progress - from.progress) * blend;
      const progress = reduced ? 0.95 : sceneProgress;
      state.current.progress = progress;
      element.dataset.phase = sampleJourney(progress, false, reduced).phase;
      element.style.setProperty(
        "--journey-dark",
        String(smoothRange(sceneProgress, 0.255, 0.28)),
      );
      element.style.setProperty(
        "--scene-shade",
        String(smoothRange(sceneProgress, 0.42, 0.46)),
      );
      element.style.setProperty("--journey-progress", String(progress));
    };
    measure();
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => {
        measure();
        update(self.progress);
      },
    });
    const observer = new ResizeObserver(() => trigger.refresh());
    observer.observe(element);
    update(trigger.progress);
    return () => {
      observer.disconnect();
      trigger.kill();
    };
  }, [reduced]);
  return (
    <div
      ref={root}
      className={`journey ${webgl ? "has-webgl" : "no-webgl"} ${reduced ? "quiet-journey" : ""}`}
      data-phase="arrival"
      data-room-ready={roomReady || reduced || !webgl}
    >
      <div className="journey-visual">
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
                onRoomReady={setRoomReady}
              />
            </Suspense>
          )}
          <div className="journey-shade" />
          <div className="journey-track" aria-hidden="true">
            <i />
          </div>
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
