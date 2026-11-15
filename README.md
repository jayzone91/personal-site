# Johannes Kirchner — Personal Site

Persönliches Portfolio für johanneskirchner.net. React, Vite, TypeScript, React Router, Three.js / React Three Fiber und GSAP. Alle Inhalte und Funktionen laufen ohne Anwendungsserver.

## Mit Bun entwickeln

Bun 1.4 oder neuer verwenden.

```sh
bun install --frozen-lockfile
bun run dev
bun run check
bun run build
bun run preview
```

`bun.lock` ist das verbindliche Lockfile. Keine zusätzlichen Paketmanager-Lockfiles einchecken.

## Apache

Den **Inhalt** von `dist/` inklusive `.htaccess` in das DocumentRoot der Domain hochladen. `mod_rewrite` und die Verwendung von `.htaccess` müssen aktiviert sein. Bei restriktivem Hosting gegebenenfalls `Options -Indexes` entfernen. BrowserRouter verwendet `/`, `/impressum` und `/datenschutz`. Unbekannte URLs zeigen eine Fehleransicht. HTTPS im Hosting konfigurieren.

Fonts werden lokal gebündelt. Keine notwendigen externen APIs, Tracker oder eingebetteten Social-Media-Inhalte. Der GitHub- und LinkedIn-Aufruf erfolgt erst durch Anklicken eines Links.

## Inhalte und Entwicklungsstand

- Die Textentwürfe stammen aus dem gemeinsam erarbeiteten Portfolio-Konzept.
- KEVIN zeigt eine konzeptionelle Modulübersicht, keine echten Kundendaten und keine produktive Oberfläche.
- Projektansichten sind eigens gestaltete Illustrationen; reale bereinigte Screenshots können sie später ergänzen.
- **Vor Veröffentlichung:** Die Platzhalter auf Impressum und Datenschutz durch die verbindlichen Texte des Betreibers ersetzen.
- Das Studium wird ohne Zeitraum erwähnt.

## Bedienung

Der Einstieg führt über ein aufklappendes Gehäuse in eine zusammenhängende Serverwerkstatt. Die Kamera folgt dem Kabelpfad zum KEVIN-Server. Dessen Türen öffnen sich und sechs verbundene Module fahren auseinander. Zurückscrollen kehrt die Bewegungen um. Die HTML-Modulauswahl hebt das entsprechende 3D-Modul hervor und zeigt eine kurze Erklärung. Der Frühstücksschalter schickt kleine Brötchen durch den Kabelpfad.

Die Bewegung lässt sich direkt auf der Bühne und im Footer reduzieren. Die Systemeinstellung wird berücksichtigt. Eine manuelle Auswahl bleibt beim Wechsel zwischen den Seiten erhalten. Ohne WebGL steht eine CSS-Ersatzansicht bereit. Die Texte und Bedienelemente bleiben als HTML zugänglich. Die Rückkehr aus Rechtstexten stellt die vorherige Scrollposition wieder her.

## Szenenarchitektur und Umfang

- `src/Journey.tsx` koordiniert eine gemeinsame sticky Bühne. ScrollTrigger schreibt den Fortschritt in eine Referenz und CSS-Variablen.
- `src/cameraPath.ts` beschreibt Kamerapositionen, Blickziele und Öffnungsphasen. Die mobile Kamerafahrt erhält zusätzliche Distanz und ein angepasstes Blickziel.
- `src/Machine.tsx` enthält prozedurale Gehäuse, Server, Module, Etiketten und Kabel. `useFrame` setzt die Transformationen direkt um. Scrollschritte lösen keine React-Zustandsänderungen aus.
- Rendering pausiert außerhalb der sichtbaren Bühne und bei verborgenem Dokument. Reduzierte Bewegung zeigt eine feste offene Systemansicht.
- Medienconverter und Remote-Arbeitsplätze ergänzen die Projektauswahl. Lizenzübernahme und geplante Zertifikatsautomatisierung sind im Automatisierungskapitel beschrieben. Die zusätzlichen Repository-Dateien wurden über die GitHub-Verbindung gelesen. Die Anwendungen wurden dabei nicht ausgeführt.

Die räumliche Umsetzung reicht bis zum geöffneten KEVIN-Server. Die anschließenden Kapitel bleiben im bisherigen HTML-Aufbau. Die räumliche Weiterfahrt zu Automatisierungen, die Verwandlung in persönliche Gegenstände und der Wiederzusammenbau am Schluss sind noch offen.

## Browserprüfung

Einmalig den Testbrowser installieren, dann den Produktionsbuild auf Port 4173 starten und in einem zweiten Terminal prüfen:

```sh
bun x playwright install chromium
bun run build
bun run preview --port 4173
# Zweites Terminal:
bun run test:smoke
```

Die Prüfung kontrolliert fünf Phasen auf Desktop und Mobilgröße, dieselbe Canvas-Instanz über die Kapitel hinweg, Modulauswahl, Frühstücksmodus, Projektaufklappen, Scrollrückkehr, Direktlinks, Rechtstext-Routen, 404, mobile Überläufe, reduzierte Bewegung und den WebGL-Ausfall. Screenshots landen im ignorierten Ordner `work/`. `PREVIEW_URL` erlaubt einen anderen Vorschauport. Für einen projektlokal installierten Testbrowser `PLAYWRIGHT_BROWSERS_PATH` beim Installieren und Prüfen auf denselben Pfad setzen.

Die Prüfung läuft in Chromium mit emulierter Mobilgröße. Ein echtes Smartphone und Apache-Webhosting wurden in dieser Umgebung nicht geprüft. Die externe Gestaltungsreferenz konnte über den verfügbaren Browserzugriff nicht geöffnet werden. Vite meldet für den separat geladenen Three.js-Chunk eine Größenwarnung.
