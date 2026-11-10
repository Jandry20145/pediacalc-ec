import { patientStore, resolveAgeMonths, formatAge, ageCategory, bsa, validateWeight, estimatedWeight, todayISO, type Sex } from './lib/patient';
import { $, field, numInput, segmented, bindSeg, num, fmt, icon, toast } from './ui';

export function mountPatientBar(el: HTMLElement) {
  const p = patientStore.get();
  const ageMode = p.dob ? 'dob' : 'age';
  el.innerHTML = `
  <section class="patient" aria-label="Datos del paciente">
    <div class="patient-head">
      <h2>Paciente</h2>
      <div style="display:flex;gap:6px">
        <button class="btn sm ghost" id="pb-est" title="Estimar peso por edad (emergencia)">Peso estimado</button>
        <button class="btn sm ghost" id="pb-reset" title="Nuevo paciente">${icon('reset')}<span>Nuevo</span></button>
        <button class="btn sm ghost" id="pb-toggle" aria-label="Contraer">${icon('chevron')}</button>
      </div>
    </div>
    <div class="patient-grid">
      ${field('Peso', numInput('pb-w', p.weightKg, 'kg', 'min="0.3" max="150"'))}
      ${field('Talla / longitud', numInput('pb-h', p.heightCm, 'cm', 'min="30" max="220"'))}
      ${field('Sexo', segmented('pb-sex', [['M', 'Niño'], ['F', 'Niña']], p.sex))}
      <div class="field"><span>Edad <button type="button" class="chip" id="pb-agemode" style="margin-left:4px;padding:0 8px">${ageMode === 'dob' ? 'usar meses' : 'usar F. nac.'}</button></span>
        <div id="pb-agebox"></div>
      </div>
      ${field('Fecha de control', `<input class="input" id="pb-date" type="date" value="${p.measureDate || todayISO()}">`)}
    </div>
    <div class="patient-summary" id="pb-sum"></div>
  </section>`;

  let mode = ageMode;
  const renderAgeBox = () => {
    const cur = patientStore.get();
    $('#pb-agebox', el).innerHTML = mode === 'dob'
      ? `<input class="input" id="pb-dob" type="date" max="${todayISO()}" value="${cur.dob ?? ''}">`
      : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${numInput('pb-y', cur.ageMonths != null ? Math.floor(cur.ageMonths / 12) : '', 'años', 'min="0" max="18"')}${numInput('pb-m', cur.ageMonths != null ? Math.round((cur.ageMonths % 12) * 10) / 10 : '', 'meses', 'min="0" max="11.9"')}</div>`;
  };
  renderAgeBox();

  const summary = () => {
    const cur = patientStore.get();
    const m = resolveAgeMonths(cur);
    const w = cur.weightKg;
    const err = validateWeight(w);
    $('#pb-w', el).classList.toggle('err', !!err);
    const parts = [
      `<span>Edad: <b>${formatAge(m)}</b></span>`,
      `<span>Grupo: <b>${ageCategory(m)}</b></span>`,
      w ? `<span>SC: <b>${fmt(bsa(w, cur.heightCm), 2)} m²</b> <small>(${cur.heightCm ? 'Mosteller' : 'sin talla'})</small></span>` : '',
      w && cur.heightCm ? `<span>IMC: <b>${fmt(w / (cur.heightCm / 100) ** 2, 1)}</b></span>` : '',
      err ? `<span style="color:var(--bad)"><b>${err}</b></span>` : ''
    ];
    $('#pb-sum', el).innerHTML = parts.filter(Boolean).join('');
  };

  el.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    switch (t.id) {
      case 'pb-w': patientStore.set({ weightKg: num(t) }); break;
      case 'pb-h': patientStore.set({ heightCm: num(t) }); break;
      case 'pb-date': patientStore.set({ measureDate: t.value || todayISO() }); break;
      case 'pb-dob': patientStore.set({ dob: t.value || null }); break;
      case 'pb-y': case 'pb-m': {
        const y = num($('#pb-y', el)), mo = num($('#pb-m', el));
        patientStore.set({ dob: null, ageMonths: y == null && mo == null ? null : (y ?? 0) * 12 + (mo ?? 0) });
        break;
      }
    }
  });
  bindSeg(el, 'pb-sex', (v) => patientStore.set({ sex: v as Sex }));
  $('#pb-agemode', el).addEventListener('click', (e) => {
    e.preventDefault();
    mode = mode === 'dob' ? 'age' : 'dob';
    const cur = patientStore.get();
    if (mode === 'age') patientStore.set({ ageMonths: resolveAgeMonths(cur), dob: null });
    $('#pb-agemode', el).textContent = mode === 'dob' ? 'usar meses' : 'usar F. nac.';
    renderAgeBox();
  });
  $('#pb-reset', el).addEventListener('click', () => {
    patientStore.reset();
    ($('#pb-w', el) as HTMLInputElement).value = '';
    ($('#pb-h', el) as HTMLInputElement).value = '';
    ($('#pb-date', el) as HTMLInputElement).value = todayISO();
    el.querySelectorAll('#pb-sex button').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.v === 'M'));
    renderAgeBox();
    toast('Datos del paciente borrados');
  });
  $('#pb-toggle', el).addEventListener('click', () => $('.patient', el).classList.toggle('collapsed'));
  $('#pb-est', el).addEventListener('click', () => {
    const m = resolveAgeMonths(patientStore.get());
    if (m == null) return toast('Ingrese primero la edad');
    const w = estimatedWeight(m);
    if (!isFinite(w)) return toast('Fórmula válida solo hasta 12 años');
    const r = Math.round(w * 10) / 10;
    patientStore.set({ weightKg: r });
    ($('#pb-w', el) as HTMLInputElement).value = String(r);
    toast(`Peso estimado (APLS): ${r} kg — pesar al paciente en cuanto sea posible`);
  });

  patientStore.subscribe(summary);
  summary();
}
