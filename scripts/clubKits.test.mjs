import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { CLUBS } from "../src/data/league.js";
import { KIT_SPLITS, getClubKits } from "../src/data/clubKits.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const expectedClubIds = [
  "pico-fc", "ca-coca-jrs", "urss-fc", "bee-fc", "los-mugiwaras-fc", "impuestos-fc",
  "maki-fc", "lego-fc", "rayo-zeta", "estaross-fc", "karasuno-falcons", "el-caudillo-fc",
];
const variants = [
  { id: "home", label: "Local" },
  { id: "away", label: "Visitante" },
  { id: "goalkeeper", label: "Portero" },
];
const fullKitClubIds = {
  "split-1": new Set([
    "bee-fc", "ca-coca-jrs", "cegatos-fc", "estaross-fc", "impuestos-fc", "lego-fc",
    "los-mugiwaras-fc", "maki-fc", "pico-fc", "playmobil-fc", "rayo-zeta", "urss-fc",
  ]),
  "split-2": new Set([
    "ca-coca-jrs", "cegatos-fc", "estaross-fc", "impuestos-fc", "lego-fc", "los-mugiwaras-fc",
    "los-pikas-fc", "maki-fc", "pico-fc", "playmobil-fc", "rayo-zeta", "urss-fc",
  ]),
};

test("el selector de equipaciones ofrece imágenes completas en Split 1 y Split 2 y kits individuales en Split 3", () => {
  assert.deepEqual(KIT_SPLITS, [
    { id: "split-1", label: "Split 1" },
    { id: "split-2", label: "Split 2" },
    { id: "split-3", label: "Split 3" },
  ]);
  assert.deepEqual(CLUBS.map(club => club.id), expectedClubIds);
  for (const clubId of expectedClubIds) {
    assert.deepEqual(
      KIT_SPLITS.map(split => getClubKits(clubId, split.id).length > 0),
      [fullKitClubIds["split-1"].has(clubId), fullKitClubIds["split-2"].has(clubId), true],
    );
  }
});

test("cada uno de los doce clubes tiene Local, Visitante y Portero en ese orden y Split 3 por defecto", () => {
  for (const clubId of expectedClubIds) {
    const expected = variants.map(variant => ({
      ...variant,
      src: `/clubs/kits/split-3/${clubId}-${variant.id}.png`,
      width: 1080,
      height: 1920,
    }));
    assert.deepEqual(getClubKits(clubId), expected, clubId);
    assert.deepEqual(getClubKits(clubId, "split-3"), expected, clubId);
  }
});

test("los 36 recursos son PNG RGBA de 1080×1920, sin rutas duplicadas ni archivos faltantes", () => {
  const kits = expectedClubIds.flatMap(clubId => getClubKits(clubId));
  assert.equal(kits.length, 36);
  assert.equal(new Set(kits.map(kit => kit.src)).size, 36);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  for (const kit of kits) {
    const file = new URL(`../public${kit.src}`, import.meta.url);
    assert.ok(existsSync(file), `Falta ${kit.src}`);
    const png = readFileSync(file);
    assert.ok(png.length > 33, `PNG vacío o incompleto: ${kit.src}`);
    assert.deepEqual(png.subarray(0, 8), pngSignature, kit.src);
    assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR", kit.src);
    assert.equal(png.readUInt32BE(16), 1080, kit.src);
    assert.equal(png.readUInt32BE(20), 1920, kit.src);
    assert.equal(png[25], 6, `Debe conservar RGBA: ${kit.src}`);
    assert.equal(png.subarray(-8, -4).toString("ascii"), "IEND", `PNG truncado: ${kit.src}`);
  }
  const actualPngs = readdirSync(new URL("../public/clubs/kits/split-3/", import.meta.url))
    .filter(name => name.toLowerCase().endsWith(".png")).sort();
  assert.deepEqual(actualPngs, kits.map(kit => kit.src.split("/").at(-1)).sort());
});

test("las imágenes completas de Split 1 y Split 2 conservan sus proporciones y rutas", () => {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  for (const [splitId, clubIds] of Object.entries(fullKitClubIds)) {
    const expectedWidth = splitId === "split-1" ? 1920 : 1468;
    for (const clubId of clubIds) {
      const [kit] = getClubKits(clubId, splitId);
      assert.deepEqual(kit, {
        id: "full",
        label: "Vista completa",
        src: `/clubs/kits/${splitId}/${clubId}-full.png`,
        width: expectedWidth,
        height: 1080,
      });
      const file = new URL(`../public${kit.src}`, import.meta.url);
      assert.ok(existsSync(file), `Falta ${kit.src}`);
      const png = readFileSync(file);
      assert.deepEqual(png.subarray(0, 8), pngSignature, kit.src);
      assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR", kit.src);
      assert.equal(png.readUInt32BE(16), expectedWidth, kit.src);
      assert.equal(png.readUInt32BE(20), 1080, kit.src);
    }
  }
});

test("los splits antiguos no inventan equipaciones cuando no existe imagen completa", () => {
  for (const clubId of expectedClubIds) {
    for (const splitId of ["split-1", "split-2"]) {
      const kits = getClubKits(clubId, splitId);
      assert.equal(kits.length > 0, fullKitClubIds[splitId].has(clubId), `${clubId}: ${splitId}`);
    }
    for (const splitId of ["elite-cup", "split-4", "desconocido", "", null]) {
      assert.deepEqual(getClubKits(clubId, splitId), [], `${clubId}: ${String(splitId)}`);
    }
  }
});

test("los clubes inactivos solo reciben la imagen completa de los splits donde existe", () => {
  for (const clubId of ["playmobil-fc", "cegatos-fc", "los-pikas-fc"]) {
    assert.deepEqual(getClubKits(clubId), [], String(clubId));
    for (const { id } of KIT_SPLITS.slice(0, 2)) {
      assert.equal(getClubKits(clubId, id).length > 0, fullKitClubIds[id].has(clubId), `${clubId}: ${id}`);
    }
    assert.equal(getClubKits(clubId, "split-3").length, 0, `${clubId}: split-3`);
  }
  for (const clubId of ["desconocido", "constructor", "__proto__", "", null, undefined]) {
    for (const { id } of KIT_SPLITS) assert.deepEqual(getClubKits(clubId, id), [], `${String(clubId)}: ${id}`);
  }
});

test("el estado Inactivo queda debajo del nombre del club y alineado a la izquierda en las cards", () => {
  const component = read("../src/components/competition.jsx");
  const nameIndex = component.indexOf("<strong>{club.name}</strong>");
  const statusIndex = component.indexOf('className="club-directory-status"', nameIndex);
  assert.ok(nameIndex >= 0 && statusIndex > nameIndex);
  const css = read("../src/styles.css");
  assert.match(css, /\.club-directory-status\s*\{[^}]*justify-self:\s*start;[^}]*text-align:\s*left;/);
});

test("la ficha pública y Mi equipo muestran una sección tras la información y reinician el visor al cambiar de club", () => {
  for (const path of ["../src/pages/TeamPage.jsx", "../src/pages/ClubPortalPage.jsx"]) {
    const page = read(path);
    assert.match(page, /import\s*\{\s*ClubKits\s*\}\s*from\s*["']\.\.\/components\/ClubKits(?:\.jsx)?["']/);
    const section = page.match(/<ClubProfileOverview\b[^>]*\/>\s*(<ClubKits\b[^>]*\/>)/)?.[1] ?? "";
    assert.match(section, /\bclub=\{club\}/);
    assert.match(section, /\bkey=\{club\.id\}/);
    assert.equal((page.match(/<ClubKits\b/g) ?? []).length, 1);
  }
});

test("los botones usan KIT_SPLITS y deshabilitan solo las ediciones sin material para ese club", () => {
  const component = read("../src/components/ClubKits.jsx");
  assert.match(component, /useState\("split-3"\)/);
  assert.match(component, /KIT_SPLITS\.map\(\(split\)\s*=>/);
  assert.match(component, /const available = getClubKits\(club\.id, split\.id\)\.length > 0;/);
  assert.match(component, /const selected = available && split\.id === selectedSplit;/);
  assert.match(component, /disabled=\{!available\}/);
  assert.match(component, /aria-pressed=\{selected\}/);
  assert.match(component, /aria-label=\{available \? split\.label : `\$\{split\.label\}: equipaciones no disponibles`\}/);
  assert.match(component, /setSelectedSplit\(split\.id\)/);
  assert.match(component, /is-full-kit-grid/);
  assert.match(component, /is-full-kit/);
  assert.match(component, /motion\.span className="club-kits-splits-indicator"/);
  assert.match(component, /useReducedMotion\(\)/);
  assert.doesNotMatch(component, /Las tres equipaciones/);
  assert.match(component, /isFullKit\s*\?\s*\(/);
  assert.match(component, /club-kit-static/);
});

test("las equipaciones mantienen imagen completa, carga diferida, etiquetas y estado vacío", () => {
  const component = read("../src/components/ClubKits.jsx");
  const css = read("../src/components/club-kits.css");
  assert.match(component, /aria-labelledby=\{titleId\}/);
  assert.match(component, /<SectionHeading\s+id=\{titleId\}\s+title="Equipaciones"/);
  assert.match(component, /src=\{siteAsset\(kit\.src\)\}/);
  for (const attribute of [/width=\{kit\.width\}/, /height=\{kit\.height\}/, /loading="lazy"/, /decoding="async"/]) {
    assert.match(component, attribute);
  }
  assert.match(component, /alt=\{`Equipación .*club\.name/);
  assert.match(component, /<figcaption>\{kit\.label\}<\/figcaption>/);
  assert.match(component, /kits\.length > 0 \?/);
  assert.match(component, /Todavía no hay equipaciones disponibles para este club\./);
  const imageRule = css.match(/\.club-kit img\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(imageRule, /height:\s*auto;/);
  assert.match(imageRule, /aspect-ratio:\s*1080\s*\/\s*1920;/);
  assert.match(imageRule, /object-fit:\s*contain;/);
});

test("cada miniatura individual abre el visor por su índice y conserva el botón que debe recuperar el foco", () => {
  const component = read("../src/components/ClubKits.jsx");
  const marker = component.indexOf('className="club-kit-open"');
  assert.ok(marker >= 0);
  const button = component.slice(component.lastIndexOf("<button", marker), component.indexOf("</button>", marker));
  assert.match(button, /type="button"/);
  assert.match(button, /aria-haspopup="dialog"/);
  assert.match(button, /aria-label=\{/);
  assert.match(button, /triggerRef\.current\s*=\s*event\.currentTarget/);
  assert.match(button, /setOpenIndex\(index\)/);
  assert.match(component, /const image = \([\s\S]*<img\b/);
  assert.match(component, /<AnimatePresence>[\s\S]*<ClubKitDialog\b[\s\S]*<\/AnimatePresence>/);
  for (const prop of [/club=\{club\}/, /kits=\{kits\}/, /initialIndex=\{openIndex\}/, /triggerRef=\{triggerRef\}/, /onClose=\{closeViewer\}/]) {
    assert.match(component, prop);
  }
  assert.match(component, /closeViewer\s*=\s*useCallback\(\(\)\s*=>\s*setOpenIndex\(null\),\s*\[\]\)/);
});

test("el visor sale al portal del body, identifica el modal y ofrece flechas, selección directa y cierre", () => {
  const dialog = read("../src/components/ClubKitDialog.jsx");
  assert.match(dialog, /return createPortal\(/);
  assert.match(dialog, /,\s*document\.body,?\s*\)/);
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby=\{titleId\}/);
  assert.match(dialog, /<h[1-6]\s+id=\{titleId\}/);
  assert.match(dialog, /tabIndex=\{-1\}/);
  assert.match(dialog, /onClick=\{onClose\}/);
  assert.match(dialog, /event\.target\s*===\s*event\.currentTarget\)\s*onClose\(\)/);
  assert.match(dialog, /changeKit\(-1\)/);
  assert.match(dialog, /changeKit\(1\)/);
  assert.match(dialog, /aria-pressed=\{index\s*===\s*activeIndex\}/);
  assert.match(dialog, /onClick=\{\(\)\s*=>\s*setSelectedIndex\(index\)\}/);
  assert.match(dialog, /aria-live="polite"/);
  assert.match(dialog, /src=\{siteAsset\(selectedKit\.src\)\}/);
  assert.match(dialog, /useReducedMotion\(\)/);
  assert.match(dialog, /initial=\{reduceMotion\s*\?\s*false/);
  const css = read("../src/components/club-kits.css");
  const imageRule = css.match(/\.club-kits-dialog-art img\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(imageRule, /object-fit:\s*contain;/);
});

// Run the production effect against small DOM doubles. This exercises keyboard
// and cleanup behavior without mounting the app, opening a browser or a session.
function createDialogHarness({ kitCount = 3, initialIndex = 0, connectedTrigger = true } = {}) {
  const source = read("../src/components/ClubKitDialog.jsx");
  const effect = source.match(/useEffect\(\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[([^\]]*)\]\);/);
  assert.ok(effect, "Debe existir el efecto de teclado, foco y scroll del visor");
  assert.doesNotMatch(effect[2], /selectedIndex|activeIndex/, "Cambiar de imagen no debe reinstalar foco y listeners");
  const listeners = new Map();
  const frames = new Map();
  const cancelledFrames = [];
  let selectedIndex = initialIndex;
  let closeCount = 0;
  const document = {
    activeElement: null,
    body: { style: { overflow: "scroll" } },
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener(name, handler) {
      assert.equal(listeners.get(name), handler);
      listeners.delete(name);
    },
  };
  const makeElement = (name, visible = true) => ({
    name, tabIndex: 0, isConnected: true,
    getClientRects: () => visible ? [{}] : [],
    focus(options) { assert.equal(options?.preventScroll, true); document.activeElement = this; },
  });
  const controls = [makeElement("close"), makeElement("previous"), makeElement("next"), makeElement("last-dot")];
  const trigger = makeElement("trigger");
  trigger.isConnected = connectedTrigger;
  const dialog = {
    ...makeElement("dialog"),
    querySelectorAll: () => [...controls, makeElement("hidden-control", false)],
    contains: element => controls.includes(element),
  };
  const window = {
    requestAnimationFrame(callback) { frames.set(1, callback); return 1; },
    cancelAnimationFrame(id) { cancelledFrames.push(id); frames.delete(id); },
  };
  const setSelectedIndex = update => { selectedIndex = typeof update === "function" ? update(selectedIndex) : update; };
  const runEffect = new Function("kitCount", "document", "window", "dialogRef", "closeButtonRef", "triggerRef", "onClose", "setSelectedIndex", effect[1]);
  const cleanup = runEffect(kitCount, document, window, { current: dialog }, { current: controls[0] }, { current: trigger }, () => closeCount++, setSelectedIndex);
  return {
    document, controls, trigger, dialog, listeners, frames, cancelledFrames, cleanup,
    get selectedIndex() { return selectedIndex; },
    get closeCount() { return closeCount; },
    press(key, options = {}) {
      const event = { key, ...options, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
      listeners.get("keydown")?.(event);
      return event;
    },
  };
}

test("Escape cierra y las flechas recorren las tres equipaciones circularmente sin capturar atajos modificados", () => {
  const view = createDialogHarness();
  assert.equal(view.press("ArrowLeft").defaultPrevented, true);
  assert.equal(view.selectedIndex, 2);
  assert.equal(view.press("ArrowRight").defaultPrevented, true);
  assert.equal(view.selectedIndex, 0);
  view.press("ArrowRight");
  assert.equal(view.selectedIndex, 1);
  for (const modifier of ["altKey", "ctrlKey", "metaKey"]) {
    assert.equal(view.press("ArrowRight", { [modifier]: true }).defaultPrevented, false);
    assert.equal(view.selectedIndex, 1);
  }
  assert.equal(view.press("Escape").defaultPrevented, true);
  assert.equal(view.closeCount, 1);
  view.cleanup();
});

test("Tab y Shift+Tab mantienen el foco dentro de los controles visibles del visor", () => {
  const view = createDialogHarness();
  view.document.activeElement = view.controls.at(-1);
  assert.equal(view.press("Tab").defaultPrevented, true);
  assert.equal(view.document.activeElement, view.controls[0]);
  assert.equal(view.press("Tab", { shiftKey: true }).defaultPrevented, true);
  assert.equal(view.document.activeElement, view.controls.at(-1));
  view.document.activeElement = view.trigger;
  view.press("Tab");
  assert.equal(view.document.activeElement, view.controls[0]);
  view.document.activeElement = view.trigger;
  view.press("Tab", { shiftKey: true });
  assert.equal(view.document.activeElement, view.controls.at(-1));
  view.document.activeElement = view.controls[1];
  assert.equal(view.press("Tab").defaultPrevented, false);
  view.dialog.querySelectorAll = () => [];
  assert.equal(view.press("Tab").defaultPrevented, true);
  assert.equal(view.document.activeElement, view.dialog);
  view.cleanup();
});

test("al abrir enfoca Cerrar y bloquea scroll; al desmontar restaura foco, scroll y listeners", () => {
  const view = createDialogHarness();
  assert.equal(view.document.body.style.overflow, "hidden");
  assert.equal(view.listeners.size, 1);
  view.frames.get(1)();
  assert.equal(view.document.activeElement, view.controls[0]);
  view.cleanup();
  assert.equal(view.document.body.style.overflow, "scroll");
  assert.equal(view.document.activeElement, view.trigger);
  assert.equal(view.listeners.size, 0);
  assert.deepEqual(view.cancelledFrames, [1]);

  const disconnected = createDialogHarness({ connectedTrigger: false });
  disconnected.document.activeElement = disconnected.controls[1];
  disconnected.cleanup();
  assert.equal(disconnected.document.activeElement, disconnected.controls[1]);

  const empty = createDialogHarness({ kitCount: 0 });
  assert.equal(empty.cleanup, undefined);
  assert.equal(empty.document.body.style.overflow, "scroll");
  assert.equal(empty.listeners.size, 0);
  assert.equal(empty.frames.size, 0);
});
