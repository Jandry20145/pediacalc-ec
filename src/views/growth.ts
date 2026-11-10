import { patientStore, resolveAgeMonths, formatAge, type Patient } from '../lib/patient';
import { assess, table, curveValue, INDICATORS, type Indicator, type Assessment } from '../lib/growth';
import { $, fmt, icon, alertBox, segmented, bindSeg, toast, esc, type View } from '../ui';

interface Control { date: string; ageMonths: number; weightKg: number | null; heightCm: number | null; sex: Patient['sex'] }
const HKEY = 'pediacalc.controls.v1';
const loadControls = (): Control[] => { try { return JSON.parse(localStorage.getItem(HKEY) || '[]'); } catch { return []; } };
const saveControls = (c: Control[]) => { try { localStorage.setItem(HKEY, JSON.stringify(c)); } catch { /* */ } };

const Z_LINES: { z: number; color: string; dash?: string; w: number }[] = [
  { z: 3, color: '#8a8f98', w: 1.4 }, { z: 2, color: '#d64545', w: 1.6 }, { z: 1, color: '#e0a100', w: 1, dash: '4 3' },
  { z: 0, color: '#1f9d55', w: 2.2 },
  { z: -1, color: '#e0a100', w: 1, dash: '4 3' }, { z: -2, color: '#d64545', w: 1.6 }, { z: -3, color: '#8a8f98', w: 1.4 }
];

function chartRange(ind: Indicator, m: number | null): [number, number] {
  if (ind === 'wfh') return m != null && m < 24 ? [45, 110] : [65, 120];
  const age = m ?? 0;
  if (age < 24) return [0, 24];
  if (age < 60) return [0, 60];
  return ind === 'wfa' ? [60, 120] : [60, 228];
}

function svgChart(ind: Indicator, p: Patient, m: number | null, points: { x: number; y: number; current?: boolean }[]): string {
  const rows = table(ind, p.sex, m ?? undefined);
  const [x0, x1] = chartRange(ind, m);
  const data = rows.filter((r) => r[0] >= x0 && r[0] <= x1);
  if (!data.length) return '<p class="muted">Sin datos de referencia para este rango.</p>';
  const W = 760, H = 420, pl = 48, pr = 34, pt = 14, pb = 38;
  let yMin = Infinity, yMax = -Infinity;
  for (const r of data) {
    yMin = Math.min(yMin, curveValue(r[1], r[2], r[3], -3.3));
    yMax = Math.max(yMax, curveValue(r[1], r[2], r[3], 3.3));
  }
  for (const pt2 of points) if (pt2.x >= x0 && pt2.x <= x1) { yMin = Math.min(yMin, pt2.y); yMax = Math.max(yMax, pt2.y); }
  const span = yMax - yMin; yMin = Math.max(0, Math.floor(yMin - span * 0.03)); yMax = Math.ceil(yMax + span * 0.03);
  const sx = (x: number) => pl + ((x - x0) / (x1 - x0)) * (W - pl - pr);
  const sy = (y: number) => pt + (1 - (y - yMin) / (yMax - yMin)) * (H - pt - pb);

  const niceStep = (range: number, target: number) => {
    const raw = range / target, mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw)!;
  };
  const yStep = niceStep(yMax - yMin, 8);
  const xStep = ind === 'wfh' ? 5 : x1 - x0 <= 24 ? 2 : x1 - x0 <= 60 ? 6 : 12;

  let g = '';
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep)
    g += `<line class="grid-line" x1="${pl}" x2="${W - pr}" y1="${sy(y)}" y2="${sy(y)}"/><text x="${pl - 6}" y="${sy(y) + 4}" text-anchor="end">${fmt(y, 1)}</text>`;
  for (let x = x0; x <= x1; x += xStep) {
    const lbl = ind === 'wfh' ? `${x}` : x % 12 === 0 && x > 0 ? `${x / 12}a` : `${x}`;
    g += `<line class="grid-line" y1="${pt}" y2="${H - pb}" x1="${sx(x)}" x2="${sx(x)}" stroke-opacity=".6"/><text x="${sx(x)}" y="${H - pb + 16}" text-anchor="middle">${lbl}</text>`;
  }
  const xlabel = ind === 'wfh' ? 'Longitud / talla (cm)' : 'Edad (meses; "a" = años)';
  g += `<text x="${(pl + W - pr) / 2}" y="${H - 4}" text-anchor="middle">${xlabel}</text>`;
  g += `<text transform="translate(12 ${(pt + H - pb) / 2}) rotate(-90)" text-anchor="middle">${INDICATORS[ind].unit}</text>`;

  // Banda normal (-2..+2)
  const up = data.map((r) => `${sx(r[0])},${sy(curveValue(r[1], r[2], r[3], 2))}`);
  const dn = data.slice().reverse().map((r) => `${sx(r[0])},${sy(curveValue(r[1], r[2], r[3], -2))}`);
  let curves = `<polygon points="${[...up, ...dn].join(' ')}" fill="#1f9d55" fill-opacity=".07"/>`;
  for (const l of Z_LINES) {
    const pts = data.map((r) => `${sx(r[0]).toFixed(1)},${sy(curveValue(r[1], r[2], r[3], l.z)).toFixed(1)}`).join(' ');
    const last = data[data.length - 1];
    curves += `<polyline points="${pts}" fill="none" stroke="${l.color}" stroke-width="${l.w}" ${l.dash ? `stroke-dasharray="${l.dash}"` : ''}/>`;
    curves += `<text x="${W - pr + 4}" y="${sy(curveValue(last[1], last[2], last[3], l.z)) + 4}" font-size="10" fill="${l.color}">${l.z > 0 ? '+' : ''}${l.z}</text>`;
  }
  const visible = points.filter((q) => q.x >= x0 && q.x <= x1).sort((a, b) => a.x - b.x);
  let pp = '';
  if (visible.length > 1) pp += `<polyline points="${visible.map((q) => `${sx(q.x)},${sy(q.y)}`).join(' ')}" fill="none" stroke="var(--brand)" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  for (const q of visible) pp += q.current
    ? `<circle cx="${sx(q.x)}" cy="${sy(q.y)}" r="7" fill="var(--brand)" stroke="#fff" stroke-width="2.5"/>`
    : `<circle cx="${sx(q.x)}" cy="${sy(q.y)}" r="4.5" fill="var(--surface)" stroke="var(--brand)" stroke-width="2"/>`;

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva ${INDICATORS[ind].name}">
    <g class="axis">${g}</g>${curves}${pp}</svg>`;
}

export const growthView: View = {
  title: 'Curvas OMS',
  mount(el) {
    let ind: Indicator = 'lhfa';
    el.innerHTML = `
      <div class="page-head"><div><h1>Curvas de crecimiento OMS</h1>
      <p>Patrones OMS 2006 (0–5 años) y Referencia OMS 2007 (5–19 años) — normas adoptadas por el MSP.</p></div>
      <button class="btn no-print" id="g-print">${icon('print')}Imprimir</button></div>
      <div class="grid" id="g-cards" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"></div>
      <div class="card" style="margin-top:16px">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="min-width:min(100%,520px)">${segmented('g-ind', [['lhfa', 'Talla/Edad'], ['wfa', 'Peso/Edad'], ['bmi', 'IMC/Edad'], ['wfh', 'Peso/Talla']], ind)}</div>
          <button class="btn sm primary no-print" id="g-save">${icon('plus')}Registrar control</button>
        </div>
        <div class="chart-wrap" id="g-chart"></div>
        <div class="chart-legend"><span><i style="background:#1f9d55"></i>Mediana (0)</span><span><i style="background:#e0a100"></i>±1 DE</span><span><i style="background:#d64545"></i>±2 DE</span><span><i style="background:#8a8f98"></i>±3 DE</span><span><i style="background:var(--brand);height:8px;width:8px;border-radius:50%"></i>Paciente</span></div>
      </div>
      <div class="grid cols-2" style="margin-top:16px">
        <div class="card"><h3>Controles registrados</h3><div id="g-hist"></div></div>
        <div class="card"><h3>${icon('info')} Interpretación (MSP / OMS)</h3>
          <div class="small muted" style="display:grid;gap:6px">
            <div><b>Talla/Edad &lt; −2 DE:</b> baja talla = desnutrición crónica (prioridad en la sierra ecuatoriana). &lt; −3: severa.</div>
            <div><b>P/T o IMC/E &lt; −2 DE:</b> emaciación (desnutrición aguda). &lt; −3: severa → referir.</div>
            <div><b>&lt; 5 años:</b> IMC/E &gt; +1 riesgo de sobrepeso, &gt; +2 sobrepeso, &gt; +3 obesidad.</div>
            <div><b>5–19 años:</b> IMC/E &gt; +1 sobrepeso, &gt; +2 obesidad; &lt; −2 delgadez.</div>
            <div>Menores de 2 años se miden acostados (longitud); de 2 años en adelante, de pie (talla).</div>
          </div></div>
      </div>`;

    bindSeg(el, 'g-ind', (v) => { ind = v as Indicator; update(); });

    const card = (a: Assessment | null, i: Indicator, reason: string) => {
      const meta = INDICATORS[i];
      if (!a) return `<div class="card flat" style="cursor:pointer" data-ind="${i}"><div class="small muted"><b>${meta.short}</b> · ${meta.name}</div><p class="small muted" style="margin:8px 0 0">${reason}</p></div>`;
      const pos = Math.max(0, Math.min(100, ((a.z + 3) / 6) * 100));
      return `<div class="card flat" style="cursor:pointer" data-ind="${i}">
        <div class="small muted"><b>${meta.short}</b> · ${meta.name}</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-top:6px"><span style="font-size:26px;font-weight:800">Z ${a.z >= 0 ? '+' : ''}${fmt(a.z, 2)}</span><span class="muted small">P${fmt(a.pct, 1)}</span></div>
        <div class="z-scale"><b style="left:${pos}%"></b></div><div class="z-labels"><span>−3</span><span>−2</span><span>0</span><span>+2</span><span>+3</span></div>
        <div style="margin-top:8px"><span class="tag ${a.cls.severity}">${a.cls.label}</span></div></div>`;
    };

    const update = () => {
      const p = patientStore.get();
      const m = resolveAgeMonths(p);
      const cards = $('#g-cards', el);
      if (m == null) {
        cards.innerHTML = alertBox('info', 'Ingrese la <b>edad o fecha de nacimiento</b>, el peso y la talla del paciente.');
      } else if (m > 228) {
        cards.innerHTML = alertBox('warn', 'Las referencias OMS cubren hasta los 19 años.');
      } else {
        const inds: Indicator[] = ['lhfa', 'wfa', 'bmi', 'wfh'];
        cards.innerHTML = inds.map((i) => {
          const a = assess(i, p.sex, m, p.weightKg, p.heightCm);
          let reason = 'Faltan datos (peso y/o talla).';
          if (i === 'wfa' && m > 120) reason = 'P/E no se usa después de los 10 años; use IMC/E.';
          if (i === 'wfh' && m >= 60) reason = 'P/T solo aplica a menores de 5 años; use IMC/E.';
          return card(a, i, reason);
        }).join('');
      }
      // Gráfico
      const hist = loadControls().filter((c) => c.sex === p.sex);
      const val = (c: { ageMonths: number; weightKg: number | null; heightCm: number | null }) => {
        if (ind === 'wfa') return c.weightKg ? { x: c.ageMonths, y: c.weightKg } : null;
        if (ind === 'lhfa') return c.heightCm ? { x: c.ageMonths, y: c.heightCm } : null;
        if (ind === 'bmi') return c.weightKg && c.heightCm ? { x: c.ageMonths, y: c.weightKg / (c.heightCm / 100) ** 2 } : null;
        return c.weightKg && c.heightCm ? { x: c.heightCm, y: c.weightKg } : null;
      };
      const pts = hist.map(val).filter(Boolean) as { x: number; y: number }[];
      if (m != null) { const cur = val({ ageMonths: m, weightKg: p.weightKg, heightCm: p.heightCm }); if (cur) pts.push({ ...cur, current: true } as never); }
      $('#g-chart', el).innerHTML = svgChart(ind, p, m, pts as { x: number; y: number; current?: boolean }[]);
      // Historial
      const all = loadControls();
      $('#g-hist', el).innerHTML = all.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Fecha</th><th>Edad</th><th class="num">Peso</th><th class="num">Talla</th><th>T/E</th><th></th></tr></thead><tbody>
        ${all.map((c, i) => { const a = assess('lhfa', c.sex, c.ageMonths, c.weightKg, c.heightCm);
          return `<tr><td>${esc(c.date)}</td><td>${formatAge(c.ageMonths)}</td><td class="num">${fmt(c.weightKg, 2)}</td><td class="num">${fmt(c.heightCm, 1)}</td><td>${a ? `<span class="tag ${a.cls.severity}">Z ${fmt(a.z, 1)}</span>` : '—'}</td><td><button class="btn sm ghost" data-del="${i}" aria-label="Eliminar">${icon('trash')}</button></td></tr>`; }).join('')}
        </tbody></table></div>`
        : '<p class="small muted" style="margin:0">Sin controles. Use “Registrar control” para seguir la evolución del niño en la curva.</p>';
    };

    $('#g-cards', el).addEventListener('click', (e) => {
      const c = (e.target as HTMLElement).closest<HTMLElement>('[data-ind]');
      if (!c) return;
      ind = c.dataset.ind as Indicator;
      el.querySelectorAll('#g-ind button').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.v === ind));
      update();
    });
    $('#g-save', el).addEventListener('click', () => {
      const p = patientStore.get();
      const m = resolveAgeMonths(p);
      if (m == null || (!p.weightKg && !p.heightCm)) return toast('Ingrese edad y al menos peso o talla');
      const all = loadControls();
      all.push({ date: p.measureDate, ageMonths: m, weightKg: p.weightKg, heightCm: p.heightCm, sex: p.sex });
      all.sort((a, b) => a.ageMonths - b.ageMonths);
      saveControls(all); update(); toast('Control registrado en este dispositivo');
    });
    $('#g-hist', el).addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-del]');
      if (!b) return;
      const all = loadControls(); all.splice(+b.dataset.del!, 1); saveControls(all); update();
    });
    $('#g-print', el).addEventListener('click', () => window.print());

    const unsub = patientStore.subscribe(update);
    update();
    return () => { unsub(); };
  }
};
