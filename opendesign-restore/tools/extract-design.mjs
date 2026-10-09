// Open any exported HTML file in Chromium and write a restore pack.
// The rules are generic: they use the DOM, computed style, and event listeners,
// never the markup conventions of one prototype.
// Usage: node extract-design.mjs <file.html> [output-dir]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRestoreInstructions } from './restore-instructions.mjs';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node extract-design.mjs <file.html> [output-dir]');
  process.exit(1);
}
const htmlPath = path.resolve(input);
if (!fs.existsSync(htmlPath)) {
  console.error('File not found: ' + htmlPath);
  process.exit(1);
}
const outDir = path.resolve(process.argv[3] || path.join(process.cwd(), 'restore-pack'));
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const CLICK_LIMIT = 300;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err).slice(0, 300)));
page.on('dialog', (dialog) => dialog.dismiss().catch(() => {}));
// A saved page is local. Block external requests so trackers cannot hold the load open.
await page.route('**/*', (route) => {
  const protocol = route.request().url().split(':')[0];
  if (protocol === 'file' || protocol === 'data' || protocol === 'blob') return route.continue();
  return route.abort();
});
const openPage = () => page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'domcontentloaded', timeout: 20000 })
  .catch((err) => errors.push('load: ' + String(err).slice(0, 300)));
console.log('Opening the page...');
await openPage();
await page.waitForTimeout(400);

// Runs in the page. Finds every element that can take part in an interaction,
// whether or not it is visible and whether or not it is a button.
const inventoryScript = () => {
  const norm = (v) => (v || '').replace(/\s+/g, ' ').trim();
  const selectorFor = (el) => {
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && parts.length < 6) {
      let part = cur.tagName.toLowerCase();
      if (cur.id) { parts.unshift('#' + CSS.escape(cur.id)); break; }
      const parent = cur.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.tagName === cur.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 && r.width > 1 && r.height > 1;
  };
  const declared = (el) => {
    const found = [];
    for (const name of el.getAttributeNames()) {
      if (name.startsWith('on')) found.push(name.slice(2));
      else if (name.startsWith('data-') && el.getAttribute(name)) found.push(name + '=' + el.getAttribute(name).slice(0, 80));
    }
    if (el.getAttribute('href')) found.push('href');
    return found;
  };
  const listenerTypes = (el) => {
    const list = typeof getEventListeners === 'function' ? getEventListeners(el) : null;
    return list ? Object.keys(list) : [];
  };

  const delegated = [...document.querySelectorAll('*')].filter((el) => listenerTypes(el).includes('click'));
  const controls = [];
  for (const el of document.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    const declaredEvents = declared(el);
    const listeners = listenerTypes(el);
    const role = el.getAttribute('role') || '';
    const tabbable = el.tabIndex >= 0 && (role === 'button' || role === 'tab' || role === 'link' || role === 'menuitem');
    const native = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'label'].includes(tag);
    const ownedByDelegation = delegated.some((root) => root !== el && root.contains(el));
    if (!native && !tabbable && !declaredEvents.length && !listeners.length && !ownedByDelegation) continue;
    // A clickable container owns its content. Skip the icon and text inside it.
    const clickableAncestor = el.parentElement && el.parentElement.closest(
      'a, button, summary, label, [role=button], [role=tab], [role=link], [role=menuitem], [onclick], [tabindex]'
    );
    if (clickableAncestor && !native) continue;
    const rect = el.getBoundingClientRect();
    controls.push({
      selector: selectorFor(el),
      tag,
      text: norm(el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').slice(0, 100),
      declared: declaredEvents.slice(0, 8),
      listeners: listeners.length ? listeners : (ownedByDelegation ? ['click (delegated)'] : []),
      visible: visible(el),
      box: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    });
  }
  return controls;
};

const snapshotScript = () => {
  const norm = (v) => (v || '').replace(/\s+/g, ' ').trim();
  const interesting = (el) => {
    const tag = el.tagName;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    return own || ['A', 'BUTTON', 'IMG', 'SVG', 'INPUT', 'H1', 'H2', 'H3'].includes(tag);
  };
  const signatureOf = (root) => [...root.querySelectorAll('*')]
    .filter(interesting)
    .slice(0, 24)
    .map((el) => el.tagName + ':' + norm(el.innerText || '').slice(0, 24))
    .join('|')
    .slice(0, 500);
  const active = [...document.querySelectorAll('*')].find((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return r.width > 200 && r.height > 200 && s.display !== 'none' && s.visibility !== 'hidden'
      && (el.className && String(el.className).includes('active'));
  });
  return {
    href: location.href,
    title: document.title,
    text: norm(document.body.innerText).slice(0, 1500),
    signature: signatureOf(active || document.body),
    scrollHeight: document.documentElement.scrollHeight,
  };
};

const designScript = () => {
  const tokens = { color: {}, font: {}, radius: {}, shadow: {}, space: {} };
  const nodes = [];
  const norm = (v) => (v || '').replace(/\s+/g, ' ').trim();
  const add = (group, value) => {
    const v = norm(value);
    if (!v || v === 'none' || v === 'normal' || v === 'auto' || v === '0px' || v === 'rgba(0, 0, 0, 0)') return;
    tokens[group][v] = (tokens[group][v] || 0) + 1;
  };
  const px = (v) => Math.round(parseFloat(v) || 0);
  const visible = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 && r.width > 1 && r.height > 1;
  };
  const rootStyle = getComputedStyle(document.documentElement);
  const variables = {};
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = [...sheet.cssRules]; } catch { continue; }
    for (const rule of rules) {
      if (!rule.selectorText || !rule.selectorText.includes(':root')) continue;
      for (const name of rule.style) {
        if (name.startsWith('--')) variables[name] = norm(rootStyle.getPropertyValue(name));
      }
    }
  }
  let skipped = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    add('color', s.color); add('color', s.backgroundColor); add('color', s.borderTopColor);
    add('font', s.fontWeight + ' ' + s.fontSize + '/' + s.lineHeight + ' ' + s.fontFamily);
    add('radius', s.borderRadius); add('shadow', s.boxShadow);
    ['marginTop', 'paddingTop', 'gap', 'rowGap', 'columnGap'].forEach((k) => add('space', s[k]));
    const own = norm([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
    const keep = own || ['A', 'BUTTON', 'IMG', 'SVG', 'INPUT', 'H1', 'H2', 'H3'].includes(el.tagName);
    if (!keep) continue;
    if (nodes.length >= 800) { skipped += 1; continue; }
    const r = el.getBoundingClientRect();
    nodes.push({
      tag: el.tagName.toLowerCase(),
      text: (own || norm(el.getAttribute('aria-label') || '')).slice(0, 140),
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      style: {
        color: s.color, background: s.backgroundColor,
        radius: s.borderRadius, shadow: norm(s.boxShadow),
        padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(px).join(' '),
        display: s.display, flexDirection: s.flexDirection, gap: s.gap,
        justifyContent: s.justifyContent, alignItems: s.alignItems, grid: s.gridTemplateColumns,
      },
    });
  }
  const ranked = (group) => Object.entries(tokens[group]).sort((a, b) => b[1] - a[1]).slice(0, 24)
    .map(([value, count]) => ({ value, count }));
  return {
    title: document.title,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    page: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
    variables,
    tokens: { color: ranked('color'), font: ranked('font'), radius: ranked('radius'), shadow: ranked('shadow'), space: ranked('space') },
    nodes, skipped,
  };
};

// Drop browser-extension overlays before measuring, for any vendor.
await page.evaluate(() => {
  const noise = /download|extension|extension-?root|plugin-?overlay|aix-/i;
  for (const el of [...document.body.children]) {
    const id = (el.id || '') + ' ' + (el.className || '');
    if (noise.test(id) && !el.querySelector('h1, main')) el.remove();
  }
});

const design = await page.evaluate(designScript);
const controls = await page.evaluate(inventoryScript);
const seen = new Set();
const states = [];
const interactions = [];

const captureState = async (reason) => {
  const snap = await page.evaluate(snapshotScript);
  if (seen.has(snap.signature)) return false;
  seen.add(snap.signature);
  const name = String(states.length).padStart(2, '0');
  await page.screenshot({ path: path.join(outDir, 'state-' + name + '.png'), fullPage: true });
  states.push({ state: name, reachedBy: reason, href: snap.href, heading: snap.signature.slice(0, 180) });
  return true;
};

await captureState('initial view');

const visibleControls = controls.filter((control) => control.visible).slice(0, CLICK_LIMIT);
const progress = (done) => {
  const width = 30;
  const filled = Math.round(width * done / visibleControls.length);
  const bar = '#'.repeat(filled) + '-'.repeat(width - filled);
  const percent = Math.round(100 * done / visibleControls.length);
  process.stdout.write('\r[' + bar + '] ' + percent + '%  ' + done + '/' + visibleControls.length);
};
console.log('Checking ' + visibleControls.length + ' controls...');
progress(0);
let clicks = 0;
for (const control of visibleControls) {
  const before = await page.evaluate(snapshotScript);
  const locator = page.locator(control.selector).first();
  try {
    await locator.click({ timeout: 1000 });
    clicks += 1;
    progress(clicks);
    await page.waitForTimeout(200);
  } catch (err) {
    interactions.push({ ...control, result: 'present but not reachable', detail: String(err).split('\n')[0].slice(0, 160) });
    continue;
  }
  if (control.tag === 'input' || control.tag === 'textarea') {
    await locator.fill('sample').catch(() => {});
  }
  const after = await page.evaluate(snapshotScript);
  let result = 'no change detected';
  if (after.href !== before.href) result = 'navigated to ' + after.href;
  else if (after.signature !== before.signature) result = 'opened a different view';
  else if (after.text !== before.text) result = 'changed visible content';
  interactions.push({
    selector: control.selector, tag: control.tag, text: control.text,
    declared: control.declared, listeners: control.listeners, result,
  });
  if (result !== 'no change detected') {
    await captureState(control.text || control.selector);
    await openPage();
    await page.waitForTimeout(200);
  }
}
process.stdout.write('\n');

const declaredOnly = controls.filter((control) => !control.visible).map((control) => ({
  selector: control.selector, tag: control.tag, text: control.text,
  declared: control.declared, listeners: control.listeners,
  result: 'declared in the document but hidden in the initial view',
}));

await browser.close();

const write = (name, value) => fs.writeFileSync(path.join(outDir, name), JSON.stringify(value, null, 2));
write('tokens.json', { source: path.basename(htmlPath), viewport: design.viewport, page: design.page, variables: design.variables, tokens: design.tokens });
write('screens.json', { title: design.title, viewport: design.viewport, states, nodes: design.nodes, truncated: design.skipped > 0 });
write('interactions.json', {
  method: 'generic DOM inventory plus click probing; not tied to one page structure',
  controlsFound: controls.length,
  clicksTried: clicks,
  clickLimit: CLICK_LIMIT,
  statesReached: states.length,
  interactions,
  declaredButHidden: declaredOnly,
  pageErrors: errors,
});

const { brief, prompt } = createRestoreInstructions({
  source: path.basename(htmlPath),
  statesReached: states.length,
});
fs.writeFileSync(path.join(outDir, 'RESTORE.md'), brief);
fs.writeFileSync(path.join(outDir, 'PROMPT.md'), prompt);

console.log('Measurement stage complete: ' + outDir);
console.log('Next: restore/reuse web source, then convert it to a Kotlin/Jetpack Compose Android project.');
console.log('controls: ' + controls.length + '  clicks: ' + clicks + '  views reached: ' + states.length + '  hidden declarations: ' + declaredOnly.length);
