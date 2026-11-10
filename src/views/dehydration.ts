import { patientStore, resolveAgeMonths } from '../lib/patient';
import { AIEPI_SIGNS, classifyDehydration, planA, planB, planC, deficitReplacement, hollidaySegar, drip } from '../lib/fluids';
import { $, field, segmented, bindSeg, num, fmt, kpi, alertBox, needWeight, type View } from '../ui';

export const dehydrationView: View = {
  title: 'Deshidratación',
  mount(el) {
    el.innerHTML = `
      <div class="page-head"><div><h1>Deshidratación</h1>
      <p>Evaluación y tratamiento según AIEPI – MSP Ecuador (Planes A, B y C).</p></div></div>
      <div class="grid cols-2">
        <div class="card">
          <h3>Evaluación clínica</h3>
          <p class="small muted" style="margin:-6px 0 10px">Marque los signos presentes (≥ 2 signos determinan la clasificación).</p>
          <div class="grid" style="gap:8px" id="dh-signs">
            ${AIEPI_SIGNS.map((s) => `<label class="check ${s.level === 'severe' ? 'sev' : 'some'}"><input type="checkbox" value="${s.id}"><span>${s.label}</span></label>`).join('')}
          </div>
          <div style="margin-top:14px">${field('Plan a calcular', segmented('dh-plan', [['auto', 'Automático'], ['A', 'Plan A'], ['B', 'Plan B'], ['C', 'Plan C'], ['H', 'Déficit']], 'auto'))}</div>
          <div class="form-grid" style="margin-top:12px" id="dh-hosp">
            ${field('% deshidratación (déficit)', `<select class="input" id="dh-pct"><option value="5">5 % (leve)</option><option value="7" selected>7 % (moderada)</option><option value="10">10 % (grave)</option></select>`)}
            ${field('Gotero', `<select class="input" id="dh-drop"><option value="20">20 gtt/ml</option><option value="60">60 µgtt/ml</option></select>`)}
          </div>
        </div>
        <div class="grid" id="dh-out" style="align-content:start"></div>
      </div>`;

    let plan = 'auto';
    bindSeg(el, 'dh-plan', (v) => { plan = v; update(); });

    const stepHtml = (label: string, vol: number, h: number, fluid: string, df: number) => {
      const d = drip(vol, h, df);
      return `<div class="step"><div><b>${label}: ${fmt(vol, 0)} ml</b> de ${fluid} en <b>${h < 1 ? h * 60 + ' min' : h + ' h'}</b><br>
        <span class="small muted">${fmt(d.mlPerHour, 0)} ml/h · ${fmt(d.dropsPerMin, 0)} ${df === 60 ? 'µgtt' : 'gtt'}/min</span></div></div>`;
    };

    const update = () => {
      const p = patientStore.get();
      const out = $('#dh-out', el);
      const checked = new Set(Array.from(el.querySelectorAll<HTMLInputElement>('#dh-signs input:checked')).map((i) => i.value));
      const level = classifyDehydration(checked);
      const cls = {
        none: { t: 'Sin deshidratación', s: 'ok', plan: 'A' },
        some: { t: 'Algún grado de deshidratación', s: 'warn', plan: 'B' },
        severe: { t: 'Deshidratación grave', s: 'bad', plan: 'C' }
      }[level];
      const chosen = plan === 'auto' ? cls.plan : plan;
      ($('#dh-hosp', el) as HTMLElement).style.display = chosen === 'H' || chosen === 'C' || chosen === 'B' ? '' : 'none';
      let html = `<div class="card"><h3>Clasificación <span class="tag ${cls.s}">${cls.t}</span></h3>
        <p class="small muted" style="margin:0">Plan recomendado: <b>Plan ${cls.plan}</b>. ${level === 'severe' ? 'Referir urgente si no puede iniciar Plan C en el establecimiento.' : ''}</p></div>`;

      if (!p.weightKg) { out.innerHTML = html + `<div class="card">${needWeight()}</div>`; return; }
      const w = p.weightKg;
      const m = resolveAgeMonths(p);
      const df = num($('#dh-drop', el)) ?? 20;

      if (chosen === 'A') {
        const a = planA(m ?? 24);
        html += `<div class="card"><h3>Plan A · Tratamiento en casa</h3><div class="steps">
          <div class="step"><div><b>Dar más líquidos:</b> SRO ${a.sroPerStool} después de cada deposición diarreica.</div></div>
          <div class="step"><div><b>Zinc:</b> ${a.zinc}.</div></div>
          <div class="step"><div><b>Continuar alimentación</b> y lactancia materna con mayor frecuencia.</div></div>
          <div class="step"><div><b>Signos de alarma</b> para volver de inmediato: no puede beber, empeora, fiebre, sangre en heces.</div></div>
        </div>${m == null ? alertBox('info', 'Ingrese la edad para ajustar volumen de SRO y zinc.') : ''}</div>`;
      } else if (chosen === 'B') {
        const b = planB(w)[0];
        html += `<div class="card"><h3>Plan B · Rehidratación oral en el servicio</h3>
          <div class="kpis">${kpi('SRO en 4 h', fmt(b.volumeMl, 0), 'ml', '75 ml/kg', true)}${kpi('Por hora', fmt(b.volumeMl / 4, 0), 'ml/h')}${kpi('Cada 15 min', fmt(b.volumeMl / 16, 0), 'ml', 'con cucharita o vaso')}</div>
          <div style="margin-top:12px">${alertBox('info', 'Si vomita, esperar 10 min y continuar más lento. Reevaluar a las 4 h y reclasificar. Considerar sonda nasogástrica (20 ml/kg/h) si no tolera.')}</div></div>`;
      } else if (chosen === 'C') {
        const steps = planC(w, m ?? 12);
        const total = steps.reduce((s, x) => s + x.volumeMl, 0);
        html += `<div class="card"><h3>Plan C · Rehidratación IV rápida <span class="tag bad">${m != null && m < 12 ? '< 12 meses: 6 h' : '≥ 12 meses: 3 h'}</span></h3>
          <div class="steps">${steps.map((s) => stepHtml(s.label, s.volumeMl, s.hours, s.fluid, df)).join('')}</div>
          <p class="small muted">Total: <b>${fmt(total, 0)} ml</b> (100 ml/kg). Repetir el primer bolo una vez si el pulso radial sigue débil.
          Reevaluar cada 15–30 min; iniciar SRO (5 ml/kg/h) cuando pueda beber.</p>
          ${m == null ? alertBox('warn', 'Edad no registrada: se asume ≥ 12 meses (3 h). Verifique.') : ''}
          ${alertBox('warn', 'Desnutrición aguda severa: NO usar Plan C estándar; usar ReSoMal / protocolo específico.')}</div>`;
      } else {
        const r = deficitReplacement(w, num($('#dh-pct', el)) ?? 7, hollidaySegar(w));
        html += `<div class="card"><h3>Reposición hospitalaria (déficit + mantenimiento, 24 h)</h3>
          <div class="kpis">${kpi('Déficit', fmt(r.deficit, 0), 'ml')}${kpi('Mantenimiento', fmt(r.total - r.deficit, 0), 'ml')}${kpi('Total 24 h', fmt(r.total, 0), 'ml', '', true)}</div>
          <div class="steps" style="margin-top:12px">
            ${stepHtml('Primeras 8 h (50 % déficit + ⅓ mant.)', r.first8.volumeMl, 8, 'solución isotónica', df)}
            ${stepHtml('Siguientes 16 h (50 % déficit + ⅔ mant.)', r.next16.volumeMl, 16, 'solución isotónica', df)}
          </div>
          ${alertBox('info', 'Hipernatremia (Na > 150): corregir el déficit en 48–72 h, descenso de Na ≤ 10–12 mEq/l/día.')}</div>`;
      }
      out.innerHTML = html;
    };

    el.addEventListener('change', update);
    el.addEventListener('input', update);
    const unsub = patientStore.subscribe(update);
    update();
    return () => { unsub(); };
  }
};
