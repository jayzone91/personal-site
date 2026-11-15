import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDown,
  Plus,
  Minus,
  Code2,
  ExternalLink,
  ArrowLeft,
  MoveUpRight,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./style.css";
import Journey from "./Journey";
import privacyHtml from "./content/privacy.html?raw";
gsap.registerPlugin(ScrollTrigger);
const projects = [
  {
    id: "01",
    name: "Computer Extra",
    category: "WEB / REACT / VITE",
    text: "Die Website von Computer Extra. Moderne Webentwicklung für den Ort, an dem mein beruflicher Weg begonnen hat.",
    url: "https://github.com/computerextra/computer-extra.de",
    kind: "web",
  },
  {
    id: "02",
    name: "links.nvim",
    category: "TOOLING / LUA / NEOVIM",
    text: "Ein kleines Neovim-Plugin für einen ganz konkreten Handgriff: Links öffnen. Auch dann, wenn netrw deaktiviert ist — mit Rücksicht auf SSH-Sitzungen.",
    url: "https://github.com/jayzone91/links.nvim",
    kind: "code",
  },
  {
    id: "03",
    name: "HyprHUD",
    category: "DESKTOP / RUST / EXPERIMENT",
    text: "Ein Desktop-Begleiter für Hyprland. Das Which-Key-Overlay ist umgesetzt; weitere Ideen stehen auf der Werkbank.",
    url: "https://github.com/jayzone91/HyprHUD",
    kind: "desktop",
  },
  {
    id: "04",
    name: "Labelsync",
    category: "AUTOMATISIERUNG / GO",
    text: "SAGE-Artikeldaten für den Labeldruck synchronisieren. Ein Werkzeug aus dem Arbeitsalltag, das einen wiederkehrenden Schritt übernimmt.",
    url: "https://github.com/computerextra/P-touch_Labelsync-go",
    kind: "label",
  },
  {
    id: "05",
    name: "Media Converter",
    category: "MEDIEN / GO / TEMPL / HTMX",
    text: "Medien und PDFs in einer eigenen Webanwendung verarbeiten. Go und templ verbinden eine HTMX-Oberfläche mit Werkzeugen wie FFmpeg, ImageMagick, Poppler und Tesseract. Das Projekt wird weiterentwickelt.",
    url: "https://github.com/jayzone91/media-converter",
    kind: "media",
  },
  {
    id: "06",
    name: "Remote-Arbeitsplätze",
    category: "WINDOWS-SHELL / GO / RDP",
    text: "Eine eigene Windows-Oberfläche für den direkten Zugriff auf die Arbeitsplätze im Team. Die native Go-Anwendung startet RDP-Verbindungen und bringt nach dem Trennen die Auswahl zurück. Als Ersatz für die Windows-Shell entwickelt. Die Abnahme auf dem Zielsystem steht laut Projektdokumentation noch aus.",
    url: "",
    kind: "remote",
  },
];
function Header({ quiet = false }: { quiet?: boolean }) {
  return (
    <header className="header">
      <Link className="logo" to="/" aria-label="Johannes Kirchner Startseite">
        j<span>k</span>
        <i>↗</i>
      </Link>
      <nav aria-label="Hauptnavigation">
        {quiet ? (
          <Link to="/">
            Zur Werkstatt <ArrowUpRight size={14} />
          </Link>
        ) : (
          <>
            <a href="#mein-weg">Mein Weg</a>
            <a href="#projekte">Projekte</a>
            <a href="#abseits">Abseits</a>
          </>
        )}
        <a className="nav-contact" href="mailto:hi@johanneskirchner.net">
          Sag Hallo <ArrowUpRight size={14} />
        </a>
      </nav>
    </header>
  );
}
let portfolioScroll = 0;
let motionOverride: boolean | undefined;
function App() {
  const location = useLocation();
  useLayoutEffect(() => {
    const destination = location.pathname === "/" ? portfolioScroll : 0;
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      let anchor: HTMLElement | null = null;
      try {
        anchor = document.getElementById(
          decodeURIComponent(location.hash.slice(1)),
        );
      } catch {
        /* A malformed hash still leaves the page usable. */
      }
      if (anchor) anchor.scrollIntoView({ behavior: "instant" });
      else
        window.scrollTo({
          top: destination,
          behavior: "instant",
        });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [location.pathname, location.hash]);
  return (
    <Routes>
      <Route path="/" element={<Portfolio />} />
      <Route path="/impressum" element={<Legal type="Impressum" />} />
      <Route path="/datenschutz" element={<Legal type="Datenschutz" />} />
      <Route path="*" element={<Legal type="404" />} />
    </Routes>
  );
}
function Portfolio() {
  const root = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(
    () =>
      motionOverride ??
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const toggleMotion = () => {
    motionOverride = !reduced;
    setReduced(!reduced);
  };
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (motionOverride === undefined) setReduced(preference.matches);
    };
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  const [active, setActive] = useState<number | null>(null);
  const [breakfast, setBreakfast] = useState(false);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [reduced]);
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal").forEach(
        (el) =>
          !el.closest(".journey") &&
          gsap.from(el, {
            y: 65,
            opacity: 0,
            duration: 0.85,
            scrollTrigger: { trigger: el, start: "top 90%" },
          }),
      );
    }, root);
    return () => ctx.revert();
  }, [reduced]);
  return (
    <div
      ref={root}
      onClickCapture={(event) => {
        const target = event.target as Element;
        if (target.closest('a[href="/impressum"], a[href="/datenschutz"]'))
          portfolioScroll = window.scrollY;
      }}
    >
      <a className="skip" href="#mein-weg">
        Zum Inhalt
      </a>
      <Header />
      <main>
        <Journey
          reduced={reduced}
          breakfast={breakfast}
          selected={selectedModule}
          onMotion={toggleMotion}
        >
          <section className="hero" aria-labelledby="name">
            <div className="hero-meta">
              <span>
                <b className="status-dot" /> KASSEL, DE · 51°18′ N 9°29′ E
              </span>
              <span>PERSÖNLICHES PORTFOLIO / VOL. 01</span>
            </div>
            <h1 id="name" className="hero-title">
              <span className="word-clip">
                <span className="word">JOHANNES</span>
              </span>
              <span className="word-clip">
                <span className="word second-word">
                  KIRCHNER<span className="title-star">✱</span>
                </span>
              </span>
            </h1>
            <div className="object-tag">
              <span className="tiny-cross">+</span> FIG. 01 — GEDANKEN IN
              BEWEGUNG
            </div>
            <div className="hero-bottom">
              <p>
                Systemadministrator.
                <br />
                Full-Stack-Entwickler.
                <br />
                <span>Immer am Weiterbauen.</span>
              </p>
              <a className="scroll-link" href="#mein-weg">
                <span>
                  REINSCHAUEN
                  <br />
                  STATT NUR VORBEI.
                </span>
                <ArrowDown size={28} />
              </a>
              <div className="hero-note">
                Computer Extra seit 2009.
                <br />
                Neugierig schon viel länger.
              </div>
            </div>
            <span className="hero-index">(01 — 06)</span>
          </section>
          <section
            className="enclosure-chapter section-pad"
            aria-labelledby="enclosure-title"
          >
            <div className="scene-copy">
              <span className="section-label">NEUGIER HAT EIN INNENLEBEN.</span>
              <h2 id="enclosure-title" className="display">
                MAL
                <br />
                REIN
                <br />
                SCHAUEN<span className="orange">.</span>
              </h2>
              <p>
                Seit meinem ersten eigenen PC will ich wissen, was
                dahintersteckt. Also Gehäuse auf. Und weiter.
              </p>
            </div>
          </section>
          <div className="immersion" aria-hidden="true" />
          <section className="about section-pad" id="mein-weg">
            <div className="section-label">
              <span>01 / MEIN WEG</span>
              <span>KEINE GERADE LINIE. MEINE LINIE.</span>
            </div>
            <div className="about-layout">
              <h2 className="display reveal">
                FRÜH
                <br />
                ANGEFANGEN.
                <br />
                <span className="outline">WEITER</span>
                <br />
                GEMACHT<span className="orange">.</span>
              </h2>
              <div className="about-copy reveal">
                <span className="sticker">LEARNING BY MACHEN ↗</span>
                <p className="lead">
                  Mein erster eigener PC war der Anfang. Die Neugier ist
                  geblieben.
                </p>
                <p>
                  Informatik als Wahlpflichtfach, Fachabi in Informatik und ein
                  begonnenes Studium an der Universität Kassel. Mein Weg führte
                  durch Service, Lager und Einkauf bis in die Entwicklung und
                  Systemadministration.
                </p>
                <p>
                  Computer Extra habe ich dabei nie verlassen. Programmieren
                  habe ich mir selbst beigebracht: erst kleine Helfer für den
                  Alltag, dann Websites und irgendwann ganze Anwendungen.
                </p>
                <details>
                  <summary>
                    Die Stationen dazwischen <Plus size={18} />
                  </summary>
                  <ol className="timeline">
                    <li>
                      <b>2009</b> Einstieg bei Computer Extra als Praktikant
                    </li>
                    <li>
                      <b>2011</b> Fachabi Informatik · danach Aushilfe
                    </li>
                    <li>
                      <b>2015</b> Lager, Service & Garantieabwicklung
                    </li>
                    <li>
                      <b>2018–2020</b> Umschulung zur Fachkraft für
                      Lagerlogistik
                    </li>
                    <li>
                      <b>Seit 2020</b> Full-Stack-Entwicklung
                    </li>
                    <li>
                      <b>Seit 2025</b> Systemadministration
                    </li>
                  </ol>
                </details>
              </div>
            </div>
          </section>
          <section
            className="core-approach section-pad"
            aria-labelledby="core-title"
          >
            <div className="scene-copy">
              <span className="section-label">
                VON KLEINEN HELFERN ZU GANZEN SYSTEMEN
              </span>
              <h2 id="core-title" className="display">
                ALLES
                <br />
                HÄNGT
                <br />
                <span className="orange">ZUSAMMEN.</span>
              </h2>
              <p>
                Aus einzelnen Werkzeugen wird ein gemeinsamer Ort für den
                Arbeitsalltag bei Computer Extra.
              </p>
              <a className="text-link" href="#kevin">
                Zum Kern der Sache <ArrowDown size={18} />
              </a>
            </div>
          </section>
          <section
            className={"kevin section-pad " + (breakfast ? "breakfast" : "")}
            id="kevin"
          >
            <div className="section-label">
              <span>02 / DAS GROSSE GANZE</span>
              <span>
                <b className="status-dot" /> IM AUFBAU
              </span>
            </div>
            <div className="kevin-top">
              <h2 className="display reveal">
                DAS IST
                <br />
                <span className="kevin-name">KEVIN.</span>
              </h2>
              <div className="kevin-intro reveal">
                <p>
                  Viele Abläufe.
                  <br />
                  Ein gemeinsamer Ort.
                </p>
                <span>
                  Ein Intranet mit CRM, Wissen, Organisation und Schnittstellen.
                  Von mir konzipiert und entwickelt — und noch lange nicht
                  fertig.
                </span>
                <small>Konzeptionelle Darstellung · im Aufbau</small>
              </div>
            </div>
            <div className="module-board">
              <div className="board-top">
                <span>KEVIN / SYSTEMÜBERSICHT</span>
                <button
                  onClick={() => setBreakfast(!breakfast)}
                  aria-pressed={breakfast}
                >
                  {breakfast ? "🥐 Frühstücksbetrieb" : "↔ Geschäftsbetrieb"}
                </button>
              </div>
              <div className="module-grid">
                {(breakfast
                  ? [
                      "Brötchen",
                      "Kaffee",
                      "Noch ein Brötchen",
                      "Frühstückswissen",
                      "Bestellungen",
                      "Krümelverwaltung",
                    ]
                  : [
                      "Kunden & CRM",
                      "Termine",
                      "Tickets & Support",
                      "Wiki & Wissen",
                      "Lizenzen",
                      "CMS & Schnittstellen",
                    ]
                ).map((x, i) => (
                  <button
                    className={
                      "module " + (selectedModule === i ? "selected" : "")
                    }
                    key={i}
                    aria-expanded={selectedModule === i}
                    aria-controls="module-description"
                    onClick={() =>
                      setSelectedModule(selectedModule === i ? null : i)
                    }
                  >
                    <span>0{i + 1} / MODUL</span>
                    <b>{x}</b>
                    <MoveUpRight size={22} />
                    <div className="module-bars">
                      <i />
                      <i />
                      <i />
                    </div>
                  </button>
                ))}
              </div>
              {selectedModule !== null && (
                <div
                  className="module-description"
                  id="module-description"
                  role="region"
                  aria-label="Moduldetails"
                >
                  <p>
                    {
                      [
                        "Kundensuche und gemeinsamer Kontext für Rechnungen, Termine und Werkstattaufträge.",
                        "Termine, Urlaub und Organisation. INTREXX-Termine werden über Go-Workflows übernommen.",
                        "Die Anbindung an Zammad verbindet Support und Intranet.",
                        "Artikel und ihre Versionen machen Wissen im Team wieder auffindbar.",
                        "Softwarelizenzen und Geschäftsabläufe werden im Intranet zusammengeführt.",
                        "Inhalte für Angebote, Mitarbeiter, Jobs und Referenzen sowie angebundene Systeme.",
                      ][selectedModule]
                    }
                  </p>
                  <small>Konzeptionelle Modulansicht · Projekt im Aufbau</small>
                </div>
              )}
              <div className="board-bottom">
                <span>REACT · TYPESCRIPT · TRPC · PRISMA</span>
                <span>VERBINDUNGEN STATT INSELLÖSUNGEN ↗</span>
              </div>
            </div>
            <details className="kevin-details">
              <summary>
                Ein Blick unter das Gehäuse <Plus size={20} />
              </summary>
              <div className="detail-columns">
                <p>
                  <b>Die Idee</b>Informationen aus unterschiedlichen
                  Arbeitsbereichen zusammenbringen. Kunden, Rechnungen, Termine
                  und Dokumentation bekommen einen gemeinsamen Kontext.
                </p>
                <p>
                  <b>Die Verbindungen</b>KEVIN bindet unter anderem SAGE,
                  INTREXX und Zammad an. Go-Workflows ergänzen die Oberfläche um
                  Synchronisation und wiederkehrende Aufgaben.
                </p>
                <p>
                  <b>Der Stand</b>Das Projekt wächst weiter. Diese Darstellung
                  ist eine konzeptionelle Übersicht mit Beispielen, kein
                  Screenshot einer produktiven Oberfläche.
                </p>
              </div>
            </details>
          </section>
        </Journey>
        <section className="workflow section-pad">
          <div className="section-label">
            <span>03 / HINTER DEN KULISSEN</span>
            <span>GO WITH THE FLOW.</span>
          </div>
          <h2 className="display reveal">
            WENIGER KLICKEN.
            <br />
            <span className="orange">MEHR PASSIERT.</span>
          </h2>
          <div className="flow-line reveal">
            <div>
              <small>01 / QUELLE</small>
              <b>SAGE & INTREXX</b>
            </div>
            <span className="flow-pipe">
              <i />
            </span>
            <div>
              <small>02 / VERARBEITUNG</small>
              <b>GO WORKFLOWS</b>
            </div>
            <span className="flow-pipe">
              <i />
            </span>
            <div>
              <small>03 / ZIEL</small>
              <b>KEVIN & BERICHTE</b>
            </div>
          </div>
          <div className="flow-copy">
            <p>
              Kunden und Lieferanten synchronisieren. Termine übernehmen.
              Rechnungsstatus prüfen. Auswertungen zusammenstellen.
            </p>
            <p>
              Die kleinen Maschinen hinter der großen Maschine. Entwickelt für
              Aufgaben, die regelmäßig wiederkommen.
            </p>
          </div>
          <details className="automation-details">
            <summary>
              Weitere Verbindungen aus der Werkstatt <Plus size={18} />
            </summary>
            <p>
              <b>Lizenzübernahme für KEVIN</b> Eine Go-Webanwendung mit templ
              und HTMX begleitet die Übernahme von Lizenz- und Vertragsdaten in
              KEVIN. Filter, Detailansichten, Kopierfunktionen und ein
              Übernahmestatus unterstützen die Bearbeitung.
            </p>
            <p>
              <b>Zertifikatsautomatisierung · in Entwicklung</b> Geplant ist die
              automatische Erneuerung von SSL-Zertifikaten auf Exchange-,
              Mailstore- und Terminalservern verschiedener Kunden anhand eines
              zentral bereitgestellten Wildcard-Zertifikats.
            </p>
          </details>
        </section>
        <section className="projects section-pad" id="projekte">
          <div className="section-label">
            <span>04 / AUS DER WERKSTATT</span>
            <a
              href="https://github.com/jayzone91"
              target="_blank"
              rel="noreferrer"
            >
              MEHR AUF GITHUB <ArrowUpRight size={15} />
            </a>
          </div>
          <h2 className="display reveal">
            AUCH NOCH
            <br />
            GEBAUT<span className="orange">↗</span>
          </h2>
          <div className="project-list">
            {projects.map((p, i) => (
              <article
                className={"project-row " + (active === i ? "open" : "")}
                key={p.id}
              >
                <button
                  className="project-trigger"
                  aria-expanded={active === i}
                  aria-controls={"project-" + i}
                  onClick={() => setActive(active === i ? null : i)}
                >
                  <span className="project-number">/{p.id}</span>
                  <h3>{p.name}</h3>
                  <span className="project-category">{p.category}</span>
                  {active === i ? <Minus /> : <Plus />}
                </button>
                <div
                  id={"project-" + i}
                  hidden={active !== i}
                  className="project-detail"
                >
                  <div className={"project-art " + p.kind} aria-hidden="true">
                    {p.kind === "code" ? (
                      <>
                        <span>~/links.nvim</span>
                        <code>
                          :OpenLink
                          <br />
                          <em>↗ browser opened.</em>
                        </code>
                      </>
                    ) : p.kind === "label" ? (
                      <div className="printed-label">
                        ARTIKEL → ETIKETT
                        <br />
                        <b>|||| || ||| || ||||</b>
                        <small>WENIGER HANDARBEIT. MEHR GO.</small>
                      </div>
                    ) : p.kind === "desktop" ? (
                      <>
                        <span>HYPRHUD / WHICH KEY?</span>
                        <div className="keycaps">
                          <b>H</b>
                          <b>J</b>
                          <b>K</b>
                          <b>L</b>
                        </div>
                      </>
                    ) : p.kind === "media" ? (
                      <>
                        <span>MEDIA CONVERTER / SCHEMATISCHE ANSICHT</span>
                        <code>
                          MEDIEN → FORMAT
                          <br />
                          <em>Go · templ · HTMX</em>
                        </code>
                      </>
                    ) : p.kind === "remote" ? (
                      <>
                        <span>REMOTE / SCHEMATISCHE ANSICHT</span>
                        <code>
                          ARBEITSPLATZ ↗<br />
                          <em>Auswählen. Verbinden.</em>
                        </code>
                      </>
                    ) : (
                      <>
                        <span>COMPUTER EXTRA</span>
                        <b>
                          Technik.
                          <br />
                          Für Menschen.
                        </b>
                        <div className="fake-window" />
                      </>
                    )}
                  </div>
                  <div>
                    <p>{p.text}</p>
                    {p.url ? (
                      <a
                        className="text-link"
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Repository ansehen <ArrowUpRight size={18} />
                      </a>
                    ) : (
                      <small>
                        Internes Projekt bei Computer Extra · privates
                        Repository
                      </small>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="off section-pad" id="abseits">
          <div className="section-label">
            <span>05 / ABSEITS DER TASTATUR</span>
            <span>AFK, ABER NICHT AUS.</span>
          </div>
          <h2 className="display reveal">
            KOPF AUS.
            <br />
            <span className="italic">NEUGIER AN.</span>
          </h2>
          <div className="personal-grid">
            <div className="personal-card bike">
              <span>01 / DRAUSSEN</span>
              <div aria-hidden="true" className="bike-symbol">
                ◎—◎
              </div>
              <h3>Eine Runde drehen.</h3>
              <p>Am liebsten mit dem Fahrrad.</p>
            </div>
            <div className="personal-card music">
              <span>02 / AUF DEN OHREN</span>
              <div className="record" aria-hidden="true">
                <i />
              </div>
              <h3>Kein festes Genre.</h3>
              <p>
                Jamiroquai, Alligatoah, Ren, Queen, Stone Sour, Foo Fighters,
                Huey Lewis & Loocush.
              </p>
            </div>
            <div className="personal-card play">
              <span>03 / NOCH EIN LEVEL</span>
              <div className="puzzle-symbol" aria-hidden="true">
                ✚
              </div>
              <h3>Welten entdecken.</h3>
              <p>
                Witcher, Horizon, Watch Dogs, Prince of Persia und Cyberpunk.
                Oder ganz analog: ein Puzzle.
              </p>
            </div>
          </div>
        </section>
        <footer className="footer section-pad" id="kontakt">
          <div className="section-label">
            <span>06 / BLEIBT IN BEWEGUNG</span>
            <span>KASSEL → INTERNET</span>
          </div>
          <h2 className="display reveal">
            WIRD WEITER
            <br />
            GEBAUT<span>✱</span>
          </h2>
          <div className="footer-links">
            <a href="mailto:hi@johanneskirchner.net">
              Sag Hallo. <ArrowUpRight />
            </a>
            <div>
              <a
                href="https://github.com/jayzone91"
                target="_blank"
                rel="noreferrer"
              >
                <Code2 size={18} /> GitHub <ArrowUpRight size={16} />
              </a>
              <a
                href="https://www.linkedin.com/in/johannes-kirchner/"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={18} /> LinkedIn <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} JOHANNES KIRCHNER</span>
            <button aria-pressed={reduced} onClick={toggleMotion}>
              Bewegung {reduced ? "reduziert" : "an"} ↔
            </button>
            <div>
              <Link to="/impressum">Impressum</Link>
              <Link to="/datenschutz">Datenschutz</Link>
              <a href="#name">Nach oben ↑</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
function Legal({ type }: { type: string }) {
  return (
    <>
      <Header quiet />
      <main className="legal section-pad">
        <span className="section-label">
          JOHANNES KIRCHNER / {type.toUpperCase()}
        </span>
        {type !== "Datenschutz" && (
          <h1 className="display">
            {type}
            <span className="orange">.</span>
          </h1>
        )}
        {type === "404" ? (
          <p>Dieses Paket hat sein Ziel verfehlt.</p>
        ) : type === "Impressum" ? (
          <>
            <p className="lead">Angaben gemäß § 5 DDG</p>
            <p>
              Johannes Kirchner
              <br />
              Sandstr. 3<br />
              34266 Niestetal
            </p>
            <p>
              <strong>Vertreten durch:</strong>
              <br />
              Johannes Kirchner
            </p>
            <p>
              <strong>Kontakt:</strong>
              <br />
              Telefon: Nicht vorhanden
              <br />
              E-Mail:{" "}
              <a href="mailto:hi@johanneskirchner.net">
                hi@johanneskirchner.net
              </a>
            </p>
            <p>
              <strong>
                Verbraucherstreitbeilegung / Universalschlichtungsstelle
              </strong>
              <br />
              Wir nehmen nicht an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teil und sind dazu auch nicht
              verpflichtet.
            </p>
            <p>
              <strong>Datenschutzerklärung</strong>
              <br />
              Unter dem folgenden Link finden Sie unsere{" "}
              <Link to="/datenschutz">Datenschutzerklärung</Link>.
            </p>
            <p>
              Erstellt mit{" "}
              <a href="https://impressum-generator.de" rel="nofollow">
                Impressum-Generator.de
              </a>
              . Rechtstext nach einer Vorlage der{" "}
              <a href="https://www.kanzlei-hasselbach.de/" rel="nofollow">
                Kanzlei Hasselbach
              </a>
              .
            </p>
          </>
        ) : (
          <article
            className="privacy-content"
            dangerouslySetInnerHTML={{ __html: privacyHtml }}
          />
        )}
        <Link className="text-link" to="/">
          <ArrowLeft size={18} /> Zurück zur Werkstatt
        </Link>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
