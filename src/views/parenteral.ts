import { patientStore, resolveAgeMonths, formatAge } from '../lib/patient';
import { computeNP, npDefaults, type NPInput } from '../lib/parenteral';
import { $, field, numInput, num, fmt, kpi, alertBox, needWeight, icon, esc, type View } from '../ui';

const FIELDS: { k: keyof NPInput; label: string; unit: string; step?: string }[] = [
  { k: 'volumeMlKg', label: 'Volumen total', unit: 'ml/kg/d' },
  { k: 'gir', label: 'Carga de glucosa (VIG)', unit: 'mg/kg/min' },
  { k: 'aa', label: 'Aminoácidos', unit: 'g/kg/d' },
  { k: 'lipids', label: 'Lípidos', unit: 'g/kg/d' },
  { k: 'na', label: 'Sodio', unit: 'mEq/kg/d' },
  { k: 'k', label: 'Potasio', unit: 'mEq/kg/d' },
  { k: 'ca', label: 'Calcio elemental', unit: 'mg/kg/d' },
  { k: 'p', label: 'Fosfato', unit: 'mmol/kg/d' },
  { k: 'mg', label: 'Magnesio', unit: 'mEq/kg/d' },
  { k: 'zinc', label: 'Zinc adicional', unit: 'µg/kg/d' },
  { k: 'purgeMl', label: 'Purga / sobrellenado', unit: 'ml' }
];

export const parenteralView: View = {
  title: 'Nutrición parenteral',
  mount(el) {
    const p0 = patientStore.get();
    const def: Record<string, number> = { ...(npDefaults(p0.weightKg ?? 10, resolveAgeMonths(p0)) as Record<string, number>), purgeMl: 30 };

    el.innerHTML = `
      <div class="page-head"><div><h1>Nutrición parenteral pediátrica</h1>
      <p>Prescripción y hoja de preparación (ESPGHAN/ESPEN/ESPR 2018). Basado en web-parenteral-nutrition, ampliado.</p></div>
      <div style="display:flex;gap:8px" class="no-print"><button class="btn" id="np-def">${icon('reset')}Valores sugeridos por edad</button><button class="btn primary" id="np-print">${icon('print')}Hoja de preparación</button></div></div>
      <div class="grid cols-2">
        <div class="card no-print">
          <h3>Prescripción</h3>
          <div class="form-grid" id="np-form">
            ${FIELDS.map((f) => field(f.label, numInput('np-' + f.k, def[f.k] ?? '', f.unit))).join('')}
            ${field('NaCl', `<select class="input" id="np-naclMeqMl"><option value="3.4">20 % (3,4 mEq/ml)</option><option value="1.7">10 % (1,7 mEq/ml)</option></select>`)}
            ${field('KCl', `<select class="input" id="np-kclMeqMl"><option value="2">2 mEq/ml</option><option value="2.7">20 % (2,7 mEq/ml)</option><option value="1.34">10 % (1,34 mEq/ml)</option></select>`)}
            ${field('MgSO₄', `<select class="input" id="np-mgMeqMl"><option value="1.62">20 % (1,62 mEq/ml)</option><option value="2.03">25 % (2,03 mEq/ml)</option></select>`)}
          </div>
          <div class="grid" style="gap:8px;margin-top:12px">
            <label class="check"><input type="checkbox" id="np-traceElements" checked><span>Oligoelementos pediátricos</span></label>
            <label class="check"><input type="checkbox" id="np-vitamins" checked><span>Vitaminas hidro y liposolubles</span></label>
            <label class="check"><input type="checkbox" id="np-lipidsSeparate" checked><span>Lípidos en jeringa/bolsa separada (2 en 1)</span></label>
          </div>
        </div>
        <div class="grid" id="np-out" style="align-content:start"></div>
      </div>
      <div class="card" id="np-sheet" style="margin-top:16px"></div>`;

    const read = (): NPInput | null => {
      const p = patientStore.get();
      if (!p.weightKg) return null;
      const g = (k: string) => num($('#np-' + k, el)) ?? 0;
      const c = (k: string) => ($('#np-' + k, el) as HTMLInputElement).checked;
      return {
        weightKg: p.weightKg, volumeMlKg: g('volumeMlKg'), gir: g('gir'), aa: g('aa'), lipids: g('lipids'), na: g('na'), k: g('k'),
        ca: g('ca'), p: g('p'), mg: g('mg'), zinc: g('zinc'), purgeMl: g('purgeMl'), naclMeqMl: g('naclMeqMl'), kclMeqMl: g('kclMeqMl'), mgMeqMl: g('mgMeqMl'),
        traceElements: c('traceElements'), vitamins: c('vitamins'), lipidsSeparate: c('lipidsSeparate')
      };
    };

    const update = () => {
      const i = read();
      const out = $('#np-out', el), sheet = $('#np-sheet', el);
      if (!i) { out.innerHTML = `<div class="card">${needWeight()}</div>`; sheet.style.display = 'none'; return; }
      if (!i.volumeMlKg) { out.innerHTML = `<div class="card">${alertBox('info', 'Ingrese el volumen total.')}</div>`; return; }
      sheet.style.display = '';
      const r = computeNP(i);
      const order = { bad: 0, warn: 1, ok: 2 };
      out.innerHTML = `
        <div class="card"><h3>Resumen</h3><div class="kpis">
          ${kpi('Volumen total', fmt(r.totalMl, 0), 'ml/día', `a preparar: ${fmt(r.prepMl, 0)} ml`, true)}
          ${kpi(i.lipidsSeparate ? 'Vel. fase acuosa' : 'Velocidad', fmt(i.lipidsSeparate ? r.rateAqueous : r.rateTotal, 1), 'ml/h', 'en 24 h', true)}
          ${i.lipidsSeparate && r.lipidMl ? kpi('Vel. lípidos', fmt(r.rateLipid, 1), 'ml/h', `${fmt(r.lipidMl, 1)} ml/día`) : ''}
          ${kpi('Energía', fmt(r.kcal.perKg, 0), 'kcal/kg/d', `${fmt(r.kcal.total, 0)} kcal/día`)}
          ${kpi('Osmolaridad', fmt(r.osmolarity, 0), 'mOsm/l', r.osmolarity > 900 ? 'Vía central' : 'Periférica posible')}
          ${kpi('Dextrosa', fmt(r.dextrosePct, 1), '%', i.lipidsSeparate ? 'fase acuosa' : 'mezcla total')}
          ${kpi('kcal no prot. / g N', fmt(r.kcal.npcN, 0), '', 'ideal 150–250')}
          ${kpi('Ca + P', fmt(r.caPhos, 1), 'mmol/l', 'límite ≈ 30')}
        </div>
        <div style="margin-top:12px;font-size:13px" class="muted">Distribución calórica: glucosa ${fmt((r.kcal.glucose / r.kcal.total) * 100, 0)} % · proteínas ${fmt((r.kcal.protein / r.kcal.total) * 100, 0)} % · lípidos ${fmt((r.kcal.lipid / r.kcal.total) * 100, 0)} %</div>
        <div style="display:flex;height:10px;border-radius:99px;overflow:hidden;margin-top:6px">
          <span style="flex:${r.kcal.glucose};background:#2a7aa8"></span><span style="flex:${r.kcal.protein};background:#19a7a0"></span><span style="flex:${r.kcal.lipid};background:#e0a100"></span></div>
        </div>
        <div>${r.alerts.sort((a, b) => order[a.level] - order[b.level]).map((a) => alertBox(a.level, a.text)).join('')}</div>`;

      const p = patientStore.get();
      sheet.innerHTML = `
        <h3>Hoja de preparación <span class="tag">Volumen a preparar ${fmt(r.prepMl, 0)} ml (incluye ${fmt(i.purgeMl, 0)} ml de purga)</span></h3>
        <p class="small muted" style="margin:-4px 0 10px">Peso ${fmt(p.weightKg, 2)} kg · Edad ${formatAge(resolveAgeMonths(p))} · Fecha ${esc(p.measureDate)} · Infundir en 24 h</p>
        <div class="table-wrap"><table class="t">
          <thead><tr><th>Componente</th><th>Aporte</th><th class="num">Prescrito (ml)</th><th class="num">A preparar (ml)</th></tr></thead>
          <tbody>${r.components.map((c, k) => `<tr><td>${esc(c.name)}</td><td class="small muted">${esc(c.detail)}</td><td class="num">${fmt(c.ml, 1)}</td><td class="num"><b>${fmt(r.prepComponents[k].ml, 1)}</b></td></tr>`).join('')}</tbody>
          <tfoot><tr><td colspan="2">Total</td><td class="num">${fmt(r.components.reduce((s, c) => s + c.ml, 0), 0)}</td><td class="num">${fmt(r.prepComponents.reduce((s, c) => s + c.ml, 0), 0)}</td></tr></tfoot>
        </table></div>
        <p class="small muted" style="margin:10px 0 0">Orden de mezcla sugerido: dextrosa → aminoácidos → electrolitos (fosfato antes y calcio al final, bien diluido) → oligoelementos/vitaminas → agua; lípidos al final o por separado.
        Preparar en campana de flujo laminar. Proteger de la luz.</p>
        <p class="print-only small" style="margin-top:30px">Firma y sello del médico: ______________________ &nbsp;&nbsp; Preparado por: ______________________</p>`;
    };

    $('#np-def', el).addEventListener('click', () => {
      const p = patientStore.get();
      const d = npDefaults(p.weightKg ?? 10, resolveAgeMonths(p)) as Record<string, number>;
      for (const k in d) { const inp = el.querySelector<HTMLInputElement>('#np-' + k); if (inp) inp.value = String(d[k]); }
      update();
    });
    $('#np-print', el).addEventListener('click', () => window.print());
    el.addEventListener('input', update);
    el.addEventListener('change', update);
    const unsub = patientStore.subscribe(update);
    update();
    return () => { unsub(); };
  }
};
