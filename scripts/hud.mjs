// Frame-driven HUD animator for DikaOfc pre-rendered scenes.
//
// Every scene calls initHud() once at import time, then applyHud(t) inside
// setFrame(t). All motion is a pure function of t (0..1), so rendered
// frames are deterministic and the loop is seamless at t=0 -> t=1.
//
// What it animates:
//  - every text character inside .hud / .title-block / [data-hud]:
//      a very small vertical wave plus a travelling cyan glow pulse; no
//      rotation or RGB splitting, so tiny 8px HUD labels stay crisp
//  - elements with ids that scenes rewrite every frame (counters):
//      gentle opacity pulse so live numbers never sit completely still
//  - .rule / .framebar gradient bars: marquee shimmer scroll
//
// Elements whose textContent is rewritten by scene code (they carry an id)
// keep their text intact; hud only touches their styling.

const TwoPi = Math.PI * 2;

const chars = []; // { el, idx, phase, glitched }
const dyn = [];   // { el, phase }
const bars = [];  // { el, size, cells }
let inited = false;

function makeSpan(ch, phase, idx) {
  const s = document.createElement('span');
  s.className = 'hch';
  s.textContent = ch;
  s.style.cssText =
    'display:inline-block;will-change:transform,opacity,text-shadow;transform-origin:50% 62%;';
  s.dataset.i = String(idx);
  return s;
}

// phase = 0.42 rad per char -> a light sweep travels along each string
function phaseFor(idx) {
  return (idx * 0.42 + Math.sin(idx * 12.9898) * 0.12) % TwoPi;
}

function splitTextNodes(root, counter) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const value = node.nodeValue;
      if (!value || !value.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.id) return NodeFilter.FILTER_REJECT; // scene-controlled counters
      const cls = parent.classList;
      if (cls.contains('dot') || cls.contains('pulse') || cls.contains('hch')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const value = node.nodeValue;
    const frag = document.createDocumentFragment();
    for (const ch of value) {
      if (/\s/.test(ch)) {
        frag.appendChild(document.createTextNode(' '));
        continue;
      }
      counter.value += 1;
      const idx = counter.value;
      const phase = phaseFor(idx);
      const span = makeSpan(ch, phase, idx);
      frag.appendChild(span);
      chars.push({ el: span, idx, phase });
    }
    node.replaceWith(frag);
  }
}

export function initHud(root = document) {
  if (typeof document === 'undefined') return;
  const counter = { value: chars.length };
  root.querySelectorAll('.hud, .title-block, [data-hud]').forEach(host => {
    if (host.__hudDone) return;
    host.__hudDone = true;
    splitTextNodes(host, counter);
  });
  root.querySelectorAll('.rule, .framebar').forEach(el => {
    if (el.__hudBar) return;
    el.__hudBar = true;
    el.style.willChange = 'background-position';
    bars.push({ el, size: 74, cells: 4 });
  });
  root.querySelectorAll('.hud [id]').forEach(el => {
    if (
      el.classList.contains('dot') ||
      el.classList.contains('pulse') ||
      el.tagName === 'CANVAS' ||
      el.__hudDyn
    ) {
      return;
    }
    el.__hudDyn = true;
    el.style.willChange = 'opacity';
    dyn.push({ el, phase: dyn.length * 1.35 });
  });
  inited = chars.length > 0 || dyn.length > 0 || bars.length > 0 || inited;
}

// re-scan newly injected HUD markup (e.g. cards built after fonts load);
// idempotent — only hosts not yet processed get split
export function rescanHud(root = document) {
  if (typeof document === 'undefined') return;
  initHud(root);
}

export function applyHud(t) {
  if (!inited) return;
  const a = t * TwoPi;

  for (const c of chars) {
    const el = c.el;
    const p = c.phase;
    const y = Math.sin(a * 2 + p) * 0.28;
    const glow = 0.08 + 0.10 * (0.5 + 0.5 * Math.sin(a * 3 + p));
    el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    el.style.textShadow = `0 0 ${(1.6 + glow * 4).toFixed(1)}px rgba(159,232,255,${glow.toFixed(2)})`;
    el.style.opacity = String(0.9 + 0.1 * (0.5 + 0.5 * Math.sin(a * 3.2 + p)));
  }

  for (const d of dyn) {
    d.el.style.opacity = String(0.86 + 0.14 * (0.5 + 0.5 * Math.sin(a * 4 + d.phase)));
  }

  for (const bar of bars) {
    bar.el.style.backgroundPosition = `${Math.round(t * bar.cells) * bar.size}px 0`;
  }
}
