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

Der Einstieg zeigt einen Serverschrank mit fest montierten Servern, einer separaten Gittertür und geschlossener Rückwand. Beim Scrollen schwenkt die Gittertür seitlich auf. Die Kamera nähert sich durch den freien mittleren Rackbereich der Rückwand. Diese öffnet sich als zweiteilige Tür zu einem bildfüllenden Serverraum. Eine eigene Scrollpassage zeigt den Raum, bevor die nächsten Texte erscheinen. Die Kamera folgt anschließend dem Kabelpfad zum KEVIN-Server. Dessen Türen öffnen sich und geben sechs fest montierte Rackeinschübe frei. Die HTML-Modulauswahl hebt den jeweiligen Einschub durch Farbe und Beleuchtung hervor und zeigt eine kurze Erklärung. Zurückscrollen kehrt die Kamerafahrt und Türbewegungen um. Der Frühstücksschalter schickt kleine Brötchen durch den Kabelpfad.

Die Bewegung lässt sich direkt auf der Bühne und im Footer reduzieren. Die Systemeinstellung wird berücksichtigt. Eine manuelle Auswahl bleibt beim Wechsel zwischen den Seiten erhalten. Ohne WebGL steht eine CSS-Ersatzansicht bereit. Die Texte und Bedienelemente bleiben als HTML zugänglich. Die Rückkehr aus Rechtstexten stellt die vorherige Scrollposition wieder her.

## Szenenarchitektur und Umfang

- `src/Journey.tsx` verankert die gemeinsame sticky Bühne an den Kapitelanfängen und der Modulauswahl. Größenänderungen aktualisieren diese Marken. Ein absoluter Bühnencontainer begrenzt die Darstellung auf den 3D-Abschnitt.
- `src/cameraPath.ts` beschreibt Kamerapositionen, Blickziele und Türbewegungen. Monotone kubische Interpolation verhindert Überschwingen und Richtungswechsel während des Eintritts. Canvas-Größe und Sichtwinkel bleiben beim Scrollen konstant. Die anfängliche Platzierung rechts erfolgt über einen Kamera-Bildausschnitt, der mit derselben geglätteten Zeitbasis wie die Kamerafahrt zentriert wird. Die Raumgeometrie behält ihren Maßstab. Der Szenenwechsel liegt hinter der zunächst geschlossenen Rückwand.
- `src/Machine.tsx` enthält prozedurale Metallgehäuse, fest montierte Rackeinschübe, Etiketten und Kabel sowie Boden, Wände, Decke und Beleuchtung des Serverraums. Die KEVIN-Bereiche haben feste Montagepositionen. Ihre Auswahl verändert Material und Beleuchtung. `useFrame` glättet den Scrollfortschritt und setzt Kamera- und Türbewegungen direkt um. Erst der tatsächliche Eintritt gibt die nächsten Texte frei.
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

Die Prüfung kontrolliert fünf Kapitel auf Desktop, breitem Bildschirm und Mobilgröße, dieselbe Canvas-Instanz, Rückwärtsscrollen, abgeschnittene Überschriften und das Ende der Bühne vor den folgenden Abschnitten. Außerdem prüft sie Modulauswahl per Tastatur, Frühstücksmodus, Projektaufklappen, Scrollrückkehr, Direktlinks, Rechtstext-Routen, 404, mobile Überläufe, reduzierte Bewegung und den WebGL-Ausfall. Screenshots landen im ignorierten Ordner `work/`. `PREVIEW_URL` erlaubt einen anderen Vorschauport. Für einen projektlokal installierten Testbrowser `PLAYWRIGHT_BROWSERS_PATH` beim Installieren und Prüfen auf denselben Pfad setzen.

Die Prüfung läuft in Chromium mit emulierter Mobilgröße. Ein echtes Smartphone und Apache-Webhosting wurden in dieser Umgebung nicht geprüft. Die externe Gestaltungsreferenz konnte über den verfügbaren Browserzugriff nicht geöffnet werden. Vite meldet für den separat geladenen Three.js-Chunk eine Größenwarnung.
