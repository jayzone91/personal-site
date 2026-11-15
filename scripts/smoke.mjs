import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { sampleJourney } from "../src/cameraPath.ts";

await mkdir("work", { recursive: true });
const base = process.env.PREVIEW_URL || "http://localhost:4173";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const errors = [];
const checks = [];
const monitor = (page) =>
  page.on("pageerror", (error) => errors.push(error.message));

// Both physical doors must clear the camera before it crosses their planes.
let previousCameraZ = Infinity;
for (let step = 0; step <= 1000; step++) {
  const progress = step / 1000;
  const frame = sampleJourney(progress, false, false);
  if (progress < 0.36 && frame.camera[2] < 1.85 && frame.open < 1)
    throw Error(`Camera crosses the closed front door at ${progress}`);
  if (progress < 0.36 && frame.camera[2] < -1.35 && frame.rearOpen < 1)
    throw Error(`Camera crosses the closed rear door at ${progress}`);
  if (frame.roomVisible && frame.fullScreen < 1)
    throw Error(`Room is exposed before the full-screen entry at ${progress}`);
  if (progress <= 0.46 && frame.camera[2] > previousCameraZ + 0.000001)
    throw Error(`Camera reverses during the doorway transition at ${progress}`);
  if (
    progress >= 0.18 &&
    progress <= 0.46 &&
    Math.abs(frame.camera[0]) > 0.000001
  )
    throw Error(`Camera leaves the doorway axis at ${progress}`);
  if (frame.fov !== sampleJourney(0, false, false).fov)
    throw Error(`Field of view changes while scrolling at ${progress}`);
  previousCameraZ = frame.camera[2];
}
checks.push(
  "door clearance, straight entry, constant field of view and monotone camera motion",
);

async function inspectOpening(page, prefix) {
  const bounds = await page.evaluate(() => {
    const position = (selector) =>
      document.querySelector(selector).getBoundingClientRect().top +
      scrollY -
      innerHeight * 0.15;
    const entry =
      document.querySelector(".immersion").getBoundingClientRect().top +
      scrollY;
    return [position(".enclosure-chapter"), entry + innerHeight * 2.4];
  });
  for (const [direction, fractions] of [
    ["forward", [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]],
    ["backward", [0.75, 0.5, 0.25]],
  ]) {
    for (const fraction of fractions) {
      await page.evaluate(
        (top) => window.scrollTo({ top, behavior: "instant" }),
        bounds[0] + (bounds[1] - bounds[0]) * fraction,
      );
      await page.waitForTimeout(700);
      const viewportStable = await page
        .locator(".world-canvas")
        .evaluate((canvas) => {
          const rect = canvas.getBoundingClientRect();
          return (
            Math.abs(rect.left) < 1 &&
            Math.abs(rect.top) < 1 &&
            Math.abs(rect.width - innerWidth) < 1 &&
            Math.abs(rect.height - innerHeight) < 1
          );
        });
      if (!viewportStable)
        throw Error(`Canvas resizes during ${prefix}/${direction}/${fraction}`);
      await page.screenshot({
        path: `work/${prefix}-opening-${direction}-${fraction}.png`,
      });
    }
  }
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    bounds[1],
  );
  await page.waitForTimeout(900);
  const fullScreen = await page.locator(".world-canvas").evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return (
      Math.abs(rect.left) < 1 &&
      Math.abs(rect.top) < 1 &&
      Math.abs(rect.width - innerWidth) < 1 &&
      Math.abs(rect.height - innerHeight) < 1
    );
  });
  if (!fullScreen)
    throw Error(`Server room does not fill the viewport in ${prefix}`);
  await expect(page.locator("#mein-weg")).not.toBeInViewport();
  await page.screenshot({ path: `work/${prefix}-full-room.png` });
}

async function inspectJourney(page, prefix) {
  await page.goto(base, { waitUntil: "networkidle" });
  await expect(page.locator(".world-canvas canvas")).toBeVisible();
  await page.waitForTimeout(1500);
  const canvas = await page.locator("canvas").elementHandle();
  await inspectOpening(page, prefix);
  for (const [selector, phase] of [
    [null, "arrival"],
    [".enclosure-chapter", "enclosure"],
    [".about", "workshop"],
    [".core-approach", "kevin"],
    [".module-board", "modules"],
  ]) {
    await page.evaluate((selector) => {
      const chapter = selector && document.querySelector(selector);
      window.scrollTo({
        top: chapter
          ? chapter.getBoundingClientRect().top + scrollY - innerHeight * 0.05
          : 0,
        behavior: "instant",
      });
    }, selector);
    await expect(page.locator(".journey")).toHaveAttribute("data-phase", phase);
    await page.waitForTimeout(900);
    if (!(await canvas.evaluate((node) => node.isConnected)))
      throw Error("Canvas was replaced between chapters");
    await page.screenshot({ path: `work/${prefix}-${phase}.png` });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    if (overflow) throw Error(`Horizontal overflow in ${prefix}/${phase}`);
  }
  const clipped = await page
    .locator(".journey .display, .hero-title")
    .evaluateAll((headings) =>
      headings
        .filter((heading) => heading.scrollWidth > heading.clientWidth + 2)
        .map((heading) => heading.textContent),
    );
  if (clipped.length)
    throw Error(`Clipped headings in ${prefix}: ${clipped.join(", ")}`);
  await page.locator(".workflow").scrollIntoViewIfNeeded();
  await page.evaluate(() =>
    window.scrollTo({
      top:
        document.querySelector(".workflow").getBoundingClientRect().top +
        scrollY,
      behavior: "instant",
    }),
  );
  const stageBottom = await page
    .locator(".journey-stage")
    .evaluate((stage) => stage.getBoundingClientRect().bottom);
  if (stageBottom > 1)
    throw Error(`3D stage overlaps the following chapter in ${prefix}`);
  await page.screenshot({ path: `work/${prefix}-after-journey.png` });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator(".journey")).toHaveAttribute(
    "data-phase",
    "arrival",
  );
  await page.waitForTimeout(900);
  await page.screenshot({ path: `work/${prefix}-reverse.png` });
  checks.push(
    `${prefix} chapter anchors, reverse scroll, unclipped headings and contained stage`,
  );
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  monitor(page);
  await inspectJourney(page, "desktop");
  await page.getByRole("link", { name: "Direkt zu KEVIN ↓" }).click();
  await expect(page.locator(".journey")).toHaveAttribute(
    "data-room-ready",
    "true",
  );
  await page.getByRole("button", { name: /Kunden & CRM/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("region", { name: "Moduldetails" }),
  ).toContainText("Kundensuche");
  await page
    .getByRole("button", { name: "↔ Geschäftsbetrieb", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Krümelverwaltung/ }),
  ).toBeVisible();
  checks.push("module selection and breakfast mode");
  await page.getByRole("button", { name: /\/02.*links.nvim/ }).click();
  await expect(
    page.getByRole("link", { name: "Repository ansehen", exact: true }),
  ).toBeVisible();
  const beforeLegal = await page.evaluate(() => scrollY);
  await page
    .locator(".footer-bottom")
    .getByRole("link", { name: "Impressum", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Impressum." })).toBeVisible();
  await page
    .getByRole("link", { name: "Zurück zur Werkstatt", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(beforeLegal - 200);
  checks.push("project expansion and return scroll position");
  for (const [path, heading] of [
    ["/impressum", "Impressum."],
    ["/datenschutz", "Datenschutz."],
    ["/missing", "404."],
  ]) {
    await page.goto(base + path);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page.goto(base + "/#kevin", { waitUntil: "networkidle" });
  await expect(page.locator(".journey")).toHaveAttribute(
    "data-room-ready",
    "true",
    { timeout: 20000 },
  );
  await expect(page.locator("#kevin .display")).toBeInViewport();
  checks.push("direct hash, legal routes, reload and 404");
  await page.locator(".journey-tools button").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator(".journey")).toHaveClass(/quiet-journey/);
  checks.push("visible reduced-motion switch");

  const wide = await browser.newPage({
    viewport: { width: 2280, height: 1248 },
  });
  monitor(wide);
  await inspectJourney(wide, "wide");
  await wide.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  monitor(mobile);
  await inspectJourney(mobile, "mobile");
  await mobile.getByRole("link", { name: "Direkt zu KEVIN ↓" }).click();
  await expect(mobile.locator(".journey")).toHaveAttribute(
    "data-room-ready",
    "true",
  );
  await mobile.getByRole("button", { name: /Lizenzen/ }).click();
  await expect(
    mobile.getByRole("region", { name: "Moduldetails" }),
  ).toContainText("Softwarelizenzen");
  await mobile.emulateMedia({ reducedMotion: "reduce" });
  await mobile.reload({ waitUntil: "networkidle" });
  await expect(mobile.locator("html")).toHaveAttribute(
    "data-motion",
    "reduced",
  );
  await mobile.screenshot({ path: "work/mobile-reduced.png" });
  checks.push("mobile module selection and system reduced motion");

  const fallback = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  monitor(fallback);
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type, ...args);
    };
  });
  await fallback.goto(base, { waitUntil: "networkidle" });
  await expect(fallback.locator(".world-fallback")).toBeVisible();
  await fallback.getByRole("link", { name: "Direkt zu KEVIN ↓" }).click();
  await expect(
    fallback.getByRole("button", { name: /Kunden & CRM/ }),
  ).toBeVisible();
  await fallback.screenshot({ path: "work/mobile-fallback.png" });
  checks.push("WebGL fallback and accessible module controls");
  console.log(JSON.stringify({ checks, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
