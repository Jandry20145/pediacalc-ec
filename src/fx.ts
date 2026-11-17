// Efectos visuales inspirados en Aceternity UI, implementados con Motion (motion.dev).
// Todos respetan "prefers-reduced-motion".
import { animate, stagger, inView } from 'motion';

const EASE = [0.22, 1, 0.36, 1] as const;
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Blur-fade escalonado al entrar en una vista (BlurFade / Aceternity) */
export function revealView(root: HTMLElement) {
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal], .page-head, .card, .tile')).slice(0, 24);
  if (reducedMotion() || !items.length) return;
  animate(items, { opacity: [0, 1], y: [14, 0], filter: ['blur(6px)', 'blur(0px)'] },
    { duration: 0.55, ease: EASE, delay: stagger(0.045) })
    .then(() => items.forEach((i) => { i.style.filter = ''; i.style.transform = ''; }));
}

/** Efecto "text generate": palabras que aparecen con desenfoque */
export function textGenerate(el: HTMLElement, delay = 0.15) {
  if (reducedMotion()) return;
  const html = el.innerHTML;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const out: string[] = [];
  tmp.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      (n.textContent ?? '').split(/(\s+)/).forEach((w) => out.push(/^\s+$/.test(w) || !w ? w : `<span class="tg-w">${w}</span>`));
    } else out.push(`<span class="tg-w">${(n as HTMLElement).outerHTML}</span>`);
  });
  el.innerHTML = out.join('');
  animate(el.querySelectorAll('.tg-w'), { opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'] },
    { duration: 0.6, delay: stagger(0.06, { startDelay: delay }), ease: 'easeOut' });
}

/** Contador animado cuando entra en pantalla */
export function counters(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const to = Number(el.dataset.count);
    const suffix = el.dataset.suffix ?? '';
    if (reducedMotion()) { el.textContent = to + suffix; return; }
    el.textContent = '0' + suffix;
    inView(el, () => {
      animate(0, to, { duration: 1.4, ease: EASE, onUpdate: (v) => { el.textContent = Math.round(v) + suffix; } });
    });
  });
}

/** Resaltado que "viaja" entre tarjetas al pasar el mouse (Card Hover Effect) */
export function hoverHighlight(container: HTMLElement, selector: string, pad = 6) {
  if (matchMedia('(hover: none)').matches) return;
  const bg = document.createElement('span');
  bg.className = 'hover-bg';
  container.prepend(bg);
  let visible = false;
  container.addEventListener('pointerover', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>(selector);
    if (!item || !container.contains(item)) return;
    const c = container.getBoundingClientRect(), r = item.getBoundingClientRect();
    const box = { x: r.left - c.left - pad, y: r.top - c.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
    if (!visible || reducedMotion()) {
      Object.assign(bg.style, { width: box.width + 'px', height: box.height + 'px', transform: `translate(${box.x}px, ${box.y}px)` });
      animate(bg, { opacity: 1 }, { duration: 0.15 });
      visible = true;
    } else {
      animate(bg, { x: box.x, y: box.y, width: box.width, height: box.height }, { type: 'spring', bounce: 0.18, duration: 0.45 });
    }
  });
  container.addEventListener('pointerleave', () => {
    visible = false;
    animate(bg, { opacity: 0 }, { duration: 0.2, delay: 0.1 });
  });
}

// ---------- Glowing Effect (borde que sigue al puntero) ----------
const glowEls = new Set<HTMLElement>();
let glowBound = false;
let lastPt = { x: -9999, y: -9999 };
let raf = 0;

function updateGlow() {
  raf = 0;
  for (const el of glowEls) {
    if (!el.isConnected) { glowEls.delete(el); continue; }
    const r = el.getBoundingClientRect();
    const prox = 64;
    const active = lastPt.x > r.left - prox && lastPt.x < r.right + prox && lastPt.y > r.top - prox && lastPt.y < r.bottom + prox;
    el.style.setProperty('--active', active ? '1' : '0');
    if (!active) continue;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const target = (Math.atan2(lastPt.y - cy, lastPt.x - cx) * 180) / Math.PI + 90;
    const cur = parseFloat(el.style.getPropertyValue('--start')) || 0;
    const diff = ((((target - cur + 180) % 360) + 360) % 360) - 180;
    el.style.setProperty('--start', String(cur + diff));
  }
}

export function glow(root: ParentNode) {
  if (matchMedia('(hover: none)').matches) return;
  root.querySelectorAll<HTMLElement>('.card, .tile, [data-glow]').forEach((el) => {
    if (el.querySelector(':scope > .glow-fx')) return;
    const g = document.createElement('div');
    g.className = 'glow-fx';
    g.setAttribute('aria-hidden', 'true');
    el.prepend(g);
    glowEls.add(el);
  });
  if (!glowBound) {
    glowBound = true;
    document.addEventListener('pointermove', (e) => {
      lastPt = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(updateGlow);
    }, { passive: true });
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(updateGlow); }, { passive: true });
  }
}

/** Indicador deslizante del menú activo */
export function navIndicator(nav: HTMLElement) {
  const pill = document.createElement('span');
  pill.className = 'nav-pill';
  nav.prepend(pill);
  let first = true;
  return () => {
    const a = nav.querySelector<HTMLElement>('a.active');
    if (!a) { pill.style.opacity = '0'; return; }
    const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
    const box = { x: r.left - n.left, y: r.top - n.top, width: r.width, height: r.height };
    if (first || reducedMotion()) {
      Object.assign(pill.style, { width: box.width + 'px', height: box.height + 'px', transform: `translate(${box.x}px, ${box.y}px)`, opacity: '1' });
      first = false;
    } else {
      animate(pill, { x: box.x, y: box.y, width: box.width, height: box.height, opacity: 1 }, { type: 'spring', bounce: 0.2, duration: 0.5 });
    }
  };
}

/** Spotlight SVG (Aceternity) */
export function spotlightSVG(fill = 'white') {
  return `<svg class="spotlight" viewBox="0 0 3787 2842" fill="none" aria-hidden="true">
    <g filter="url(#spot-blur)"><ellipse cx="1924.71" cy="273.501" rx="1924.71" ry="273.501"
      transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)" fill="${fill}" fill-opacity="0.21"/></g>
    <defs><filter id="spot-blur" x="0.86" y="0.84" width="3785.16" height="2840.26" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feGaussianBlur stdDeviation="151" result="blur"/></filter></defs></svg>`;
}

export function playSpotlight(root: HTMLElement) {
  const s = root.querySelector<SVGElement>('.spotlight');
  if (!s) return;
  if (reducedMotion()) { s.style.opacity = '1'; s.style.transform = 'translate(-50%, -40%)'; return; }
  animate(s, { opacity: [0, 1], x: ['-72%', '-50%'], y: ['-62%', '-40%'], scale: [0.5, 1] }, { duration: 2, delay: 0.6, ease: 'easeOut' });
}

/** Animación sutil al cambiar un resultado */
export function pulse(el: Element | null) {
  if (!el || reducedMotion()) return;
  animate(el, { scale: [0.97, 1], opacity: [0.6, 1] }, { duration: 0.3, ease: EASE });
}
