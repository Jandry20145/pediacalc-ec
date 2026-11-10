import { patientStore, bsa } from '../lib/patient';
import { maintenance, drip, gir, solutionRecipe, rule421 } from '../lib/fluids';
import { $, field, numInput, segmented, bindSeg, num, fmt, kpi, alertBox, needWeight, type View } from '../ui';

export const fluidsView: View = {
  title: 'Líquidos',
  mount(el) {
    el.innerHTML = `
      <div class="page-head"><div><h1>Líquidos de mantenimiento y goteo</h1>
      <p>Requerimientos basales, velocidad de infusión y preparación de la solución.</p></div></div>
      <div class="grid cols-2">
        <div class="card">
          <h3>Parámetros</h3>
          <div class="form-grid">
            ${field('Método', segmented('f-method', [['hs', 'Holliday'], ['bsa', 'SC (m²)']], 'hs'))}
            ${field('Aporte', `<select class="input" id="f-factor">
              <option value="1">100 % (basal)</option><option value="1.5">150 % (pérdidas aumentadas)</option>
              <option value="0.75">75 % (restricción leve)</option><option value="0.66">66 % (restricción – SIADH, meningitis)</option>
              <option value="0.5">50 %</option></select>`)}
            ${field('Temperatura máx.', numInput('f-temp', '', '°C', 'min="35" max="42" placeholder="opcional"'))}
            ${field('Gotero', `<select class="input" id="f-drop"><option value="20">Macrogotero 20 gtt/ml</option><option value="60">Microgotero 60 µgtt/ml</option><option value="15">Equipo 15 gtt/ml</option><option value="10">Equipo 10 gtt/ml</option></select>`)}
            ${field('Dextrosa de la solución', `<select class="input" id="f-dx"><option value="5">Dextrosa 5 %</option><option value="10">Dextrosa 10 %</option><option value="0">Sin dextrosa</option></select>`)}
          </div>
          <h3 style="margin-top:18px">Solución a preparar</h3>
          <div class="form-grid">
            ${field('Volumen del frasco', numInput('f-vol', 500, 'ml'))}
            ${field('Na deseado', `<select class="input" id="f-na"><option value="77">77 mEq/l (SS 0,45 %)</option><option value="140" selected>140 mEq/l (isotónica)</option><option value="154">154 mEq/l (SS 0,9 %)</option><option value="34">34 mEq/l (SS 0,2 %)</option></select>`)}
            ${field('K deseado', numInput('f-k', 20, 'mEq/l'))}
            ${field('NaCl ampolla', `<select class="input" id="f-nac"><option value="3.4">NaCl 20 % (3,4 mEq/ml)</option><option value="1.7">NaCl 10 % (1,7 mEq/ml)</option></select>`)}
            ${field('KCl ampolla', `<select class="input" id="f-kc"><option value="2">KCl 2 mEq/ml</option><option value="2.7">KCl 20 % (2,7 mEq/ml)</option><option value="1.34">KCl 10 % (1,34 mEq/ml)</option></select>`)}
          </div>
        </div>
        <div class="grid" id="f-out"></div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Calculadora rápida de goteo</h3>
        <div class="form-grid">
          ${field('Volumen', numInput('d-vol', 500, 'ml'))}
          ${field('Tiempo', numInput('d-h', 8, 'h'))}
          ${field('Factor gotero', `<select class="input" id="d-f"><option value="20">20 gtt/ml</option><option value="60">60 µgtt/ml</option><option value="15">15 gtt/ml</option><option value="10">10 gtt/ml</option></select>`)}
        </div>
        <div class="kpis" id="d-out" style="margin-top:14px"></div>
      </div>`;

    let method: 'hs' | 'bsa' = 'hs';
    bindSeg(el, 'f-method', (v) => { method = v as 'hs' | 'bsa'; update(); });

    const quick = () => {
      const v = num($('#d-vol', el)), h = num($('#d-h', el)), f = num($('#d-f', el))!;
      if (!v || !h) { $('#d-out', el).innerHTML = ''; return; }
      const r = drip(v, h, f);
      $('#d-out', el).innerHTML = kpi('Velocidad', fmt(r.mlPerHour, 1), 'ml/h', '', true) +
        kpi(f === 60 ? 'Microgotas' : 'Gotas', fmt(r.dropsPerMin, 0), '/min', `≈ ${fmt(r.dropsPerMin / 4, 0)} cada 15 s`) +
        kpi('1 gota cada', fmt(r.secondsPerDrop, 1), 's');
    };

    const update = () => {
      const p = patientStore.get();
      const out = $('#f-out', el);
      if (!p.weightKg) { out.innerHTML = `<div class="card">${needWeight()}</div>`; return; }
      const w = p.weightKg;
      const s = bsa(w, p.heightCm);
      const m = maintenance(w, { method, bsaM2: s, factor: num($('#f-factor', el))!, feverC: num($('#f-temp', el)) ?? undefined });
      const df = num($('#f-drop', el))!;
      const d = drip(m.dailyMl, 24, df);
      const dx = num($('#f-dx', el))!;
      const g = gir(dx, m.mlPerHour, w);
      const vol = num($('#f-vol', el)) ?? 500;
      const rec = solutionRecipe(vol, num($('#f-na', el))!, num($('#f-k', el)) ?? 0, num($('#f-nac', el))!, num($('#f-kc', el))!);
      const kMeqL = num($('#f-k', el)) ?? 0;
      const warn: string[] = [];
      if (method === 'bsa' && w < 10) warn.push(alertBox('warn', 'El método por superficie corporal no se recomienda en < 10 kg.'));
      if (kMeqL > 40) warn.push(alertBox('bad', `Potasio ${kMeqL} mEq/l > 40 mEq/l: no administrar por vía periférica.`));
      if (dx > 0 && g < 4 && w < 10) warn.push(alertBox('warn', `VIG ${fmt(g, 1)} mg/kg/min: baja para lactante, riesgo de hipoglucemia.`));
      warn.push(alertBox('info', 'MSP/AAP 2018: preferir soluciones <b>isotónicas</b> (Na 130–154 mEq/l) con dextrosa 5 % para mantenimiento IV, por riesgo de hiponatremia.'));

      out.innerHTML = `
        <div class="card">
          <h3>Mantenimiento · ${m.method}</h3>
          <div class="kpis">
            ${kpi('Volumen diario', fmt(m.dailyMl, 0), 'ml/día', `${fmt(m.dailyMl / w, 0)} ml/kg/día`, true)}
            ${kpi('Velocidad', fmt(m.mlPerHour, 1), 'ml/h', `Regla 4-2-1: ${fmt(rule421(w), 0)} ml/h`, true)}
            ${kpi(df === 60 ? 'Microgotas' : 'Gotas', fmt(d.dropsPerMin, 0), '/min', `1 gota cada ${fmt(d.secondsPerDrop, 1)} s`)}
            ${kpi('VIG', dx ? fmt(g, 1) : '0', 'mg/kg/min', `con dextrosa ${dx} %`)}
            ${kpi('Na basal', fmt(m.naMeqDay, 1), 'mEq/día', '3 mEq/100 ml')}
            ${kpi('K basal', fmt(m.kMeqDay, 1), 'mEq/día', '2 mEq/100 ml')}
          </div>
        </div>
        <div class="card">
          <h3>Preparación: frasco de ${fmt(vol, 0)} ml</h3>
          <table class="t"><thead><tr><th>Componente</th><th class="num">Volumen</th></tr></thead><tbody>
            <tr><td>Dextrosa 5 % en agua</td><td class="num">${fmt(rec.dextroseMl, 1)} ml</td></tr>
            <tr><td>${num($('#f-nac', el)) === 3.4 ? 'NaCl 20 %' : 'NaCl 10 %'}</td><td class="num">${fmt(rec.naclMl, 1)} ml</td></tr>
            <tr><td>KCl</td><td class="num">${fmt(rec.kclMl, 1)} ml</td></tr>
          </tbody><tfoot><tr><td>Total</td><td class="num">${fmt(vol, 0)} ml</td></tr></tfoot></table>
          <p class="small muted" style="margin:8px 0 0">Na ${rec.naMeqL} mEq/l · K ${rec.kMeqL} mEq/l · Dextrosa final ≈ ${fmt(rec.dextrosePct, 1)} %.
          Alternativa práctica: Dextrosa 5 % en SS 0,9 % + KCl.</p>
        </div>
        <div>${warn.join('')}</div>`;
    };

    el.addEventListener('input', (e) => {
      const id = (e.target as HTMLElement).id;
      if (id.startsWith('d-')) quick(); else update();
    });
    el.addEventListener('change', (e) => {
      const id = (e.target as HTMLElement).id;
      if (id.startsWith('d-')) quick(); else update();
    });
    const unsub = patientStore.subscribe(update);
    update(); quick();
    return () => { unsub(); };
  }
};
