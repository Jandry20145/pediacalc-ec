// Utilidades de interfaz
export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as T[];

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function fmt(n: number | null | undefined, dec = 1): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: dec });
}

export const num = (el: Element | null): number | null => {
  if (!el) return null;
  const v = parseFloat(String((el as HTMLInputElement).value).replace(',', '.'));
  return isFinite(v) ? v : null;
};

export const ICONS: Record<string, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
  dehy: '<path d="M8 3h8l-1 6h-6zM9 9c-2 2-3 4-3 7a6 6 0 0 0 12 0c0-3-1-5-3-7"/><path d="M9.5 15.5h5"/>',
  pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="m8.5 8.5 7 7"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  bad: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>'
};

export const icon = (name: string, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ''}</svg>`;

export function alertBox(level: 'ok' | 'warn' | 'bad' | 'info', text: string): string {
  const ic = level === 'info' ? 'info' : level === 'ok' ? 'ok' : level === 'warn' ? 'warn' : 'bad';
  return `<div class="alert ${level === 'info' ? '' : level}">${icon(ic)}<div>${text}</div></div>`;
}

export function kpi(label: string, value: string, unit = '', sub = '', hl = false): string {
  return `<div class="kpi ${hl ? 'hl' : ''}"><div class="lbl">${label}</div><div class="val">${value}${unit ? `<small>${unit}</small>` : ''}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
}

export function field(label: string, inner: string): string {
  return `<label class="field"><span>${label}</span>${inner}</label>`;
}

export function numInput(id: string, value: number | string | null, unit = '', attrs = ''): string {
  return `<div class="input-unit"><input class="input" id="${id}" type="number" inputmode="decimal" step="any" value="${value ?? ''}" ${attrs}>${unit ? `<em>${unit}</em>` : ''}</div>`;
}

export function segmented(id: string, options: [string, string][], value: string): string {
  return `<div class="seg" id="${id}" role="radiogroup">${options
    .map(([v, l]) => `<button type="button" data-v="${v}" class="${v === value ? 'on' : ''}" role="radio" aria-checked="${v === value}">${l}</button>`)
    .join('')}</div>`;
}

/** Conecta un segmented control; devuelve getter */
export function bindSeg(root: ParentNode, id: string, onChange: (v: string) => void) {
  const el = $(`#${id}`, root);
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    $$('button', el).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); });
    onChange(b.dataset.v!);
  });
}

export function toast(msg: string) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

export const needWeight = () =>
  alertBox('info', 'Ingrese el <b>peso</b> del paciente en la barra superior para calcular.');

export interface View {
  title: string;
  mount(el: HTMLElement): (() => void) | void;
}
