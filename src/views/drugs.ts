import { patientStore, resolveAgeMonths } from '../lib/patient';
import { DRUGS, GROUPS, type Drug } from '../data/drugs';
import { computeDose, formatAmount, intervalLabel } from '../lib/dosing';
import { $, esc, fmt, icon, alertBox, needWeight, type View } from '../ui';

export const drugsView: View = {
  title: 'Fármacos',
  mount(el) {
    let selected: Drug = DRUGS[0];
    let group: string = 'Todos';
    let query = '';
    const doseSel = new Map<string, number>();

    el.innerHTML = `
      <div class="page-head"><div><h1>Vademécum pediátrico</h1>
      <p>Dosis por peso con presentaciones del Cuadro Nacional de Medicamentos Básicos.</p></div></div>
      <div class="drug-layout">
        <div class="card" style="padding:12px">
          <div class="input-unit" style="margin-bottom:10px"><input class="input" id="dr-q" placeholder="Buscar fármaco…" type="search" autocomplete="off"><em>${icon('search')}</em></div>
          <div class="chips" id="dr-chips">${['Todos', ...GROUPS].map((g) => `<button class="chip ${g === 'Todos' ? 'on' : ''}" data-g="${g}">${g}</button>`).join('')}</div>
          <div class="drug-list" id="dr-list"></div>
        </div>
        <div id="dr-detail" class="grid"></div>
      </div>`;

    const renderList = () => {
      const q = query.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      const items = DRUGS.filter((d) => (group === 'Todos' || d.group === group) &&
        d.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(q));
      const byGroup = GROUPS.map((g) => [g, items.filter((d) => d.group === g)] as const).filter(([, l]) => l.length);
      $('#dr-list', el).innerHTML = byGroup.length ? byGroup.map(([g, l]) => `<h4>${g}</h4>${l.map((d) =>
        `<button data-id="${d.id}" class="${d.id === selected.id ? 'on' : ''}"><span>${esc(d.name)}</span><small>${d.route}</small></button>`).join('')}`).join('')
        : '<p class="muted small" style="padding:8px">Sin resultados</p>';
    };

    const renderDetail = () => {
      const p = patientStore.get();
      const d = selected;
      const out = $('#dr-detail', el);
      const unitKg = d.mode === 'perDay' ? `${d.unit}/kg/día` : `${d.unit}/kg/dosis`;
      const range = d.mode === 'perDay' || d.mode === 'perDose'
        ? `${fmt(d.doseMin!, 3)}${d.doseMax !== d.doseMin ? '–' + fmt(d.doseMax!, 3) : ''} ${unitKg}`
        : d.bands!.map((b, i) => `${b.note ?? (i === 0 ? `< ${b.upTo} kg` : `≥ ${d.bands![i - 1].upTo} kg`)}: ${formatAmount(b.dose, d.unit)}`).join(' · ');

      let head = `<div class="card">
        <h3 style="font-size:20px">${esc(d.name)} <span class="tag">${d.group}</span></h3>
        <div class="small muted" style="display:flex;flex-wrap:wrap;gap:4px 16px">
          <span>Vía: <b>${d.route}</b></span><span>Dosis: <b>${range}</b></span><span>Intervalo: <b>${intervalLabel(d)}</b></span>
          ${d.maxPerDose ? `<span>Máx./dosis: <b>${formatAmount(d.maxPerDose, d.unit)}</b></span>` : ''}
          ${d.maxPerDay ? `<span>Máx./día: <b>${formatAmount(d.maxPerDay, d.unit)}</b></span>` : ''}
        </div>`;

      if (!p.weightKg) { out.innerHTML = head + `<div style="margin-top:12px">${needWeight()}</div></div>`; return; }

      const ranged = (d.mode === 'perDay' || d.mode === 'perDose') && d.doseMax! > d.doseMin!;
      const sel = doseSel.get(d.id) ?? d.doseDefault ?? d.doseMin;
      if (ranged) {
        const step = (d.doseMax! - d.doseMin!) / 20;
        head += `<div style="margin-top:14px"><label class="field"><span>Dosis seleccionada: <b id="dr-selv">${fmt(sel!, 3)} ${unitKg}</b></span>
          <input type="range" id="dr-range" min="${d.doseMin}" max="${d.doseMax}" step="${step}" value="${sel}"></label></div>`;
      }
      head += '</div>';
      out.innerHTML = head + '<div id="dr-res" class="grid"></div>';
      renderResult();
      const rg = el.querySelector<HTMLInputElement>('#dr-range');
      rg?.addEventListener('input', () => {
        doseSel.set(d.id, parseFloat(rg.value));
        $('#dr-selv', el).textContent = `${fmt(parseFloat(rg.value), 3)} ${unitKg}`;
        renderResult();
      });
    };

    const renderResult = () => {
      const p = patientStore.get();
      const d = selected;
      const sel = doseSel.get(d.id) ?? d.doseDefault ?? d.doseMin;
      const m = resolveAgeMonths(p);
      const r = computeDose(d, p.weightKg!, m, sel);
      const capMsg = { none: '', maxDose: 'Se aplicó la dosis máxima por toma.', maxDay: 'Se aplicó la dosis máxima diaria.', minDose: 'Se aplicó la dosis mínima por toma.' }[r.capped];

      $('#dr-res', el).innerHTML = `
        <div class="card">
          <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end">
            <div><div class="small muted">Dosis por toma ${r.bandNote ? `(${r.bandNote})` : ''}</div><div class="dose-big">${formatAmount(r.perDose, d.unit)}</div></div>
            <div><div class="small muted">Frecuencia</div><div style="font-size:20px;font-weight:700">${intervalLabel(d)}${r.dosesPerDay ? ` · ${fmt(r.dosesPerDay, 0)} tomas/día` : ''}</div></div>
            ${r.perDay ? `<div><div class="small muted">Total diario</div><div style="font-size:20px;font-weight:700">${formatAmount(r.perDay, d.unit)}</div></div>` : ''}
          </div>
          <div class="table-wrap" style="margin-top:14px"><table class="t">
            <thead><tr><th>Presentación</th><th class="num">Administrar por toma</th></tr></thead>
            <tbody>${r.volumes.map((v) => `<tr><td>${esc(v.p.label)}</td><td class="num"><b>${v.text}</b></td></tr>`).join('')}</tbody>
          </table></div>
          ${d.duration ? `<p class="small" style="margin:12px 0 0"><b>Duración:</b> ${esc(d.duration)}</p>` : ''}
        </div>
        <div>
          ${capMsg ? alertBox('warn', capMsg) : ''}
          ${r.warnings.map((w) => alertBox('bad', w)).join('')}
          ${d.notes ? alertBox('info', esc(d.notes)) : ''}
          ${d.emergency ? alertBox('warn', 'Fármaco de emergencia: verificar con doble chequeo y monitorización.') : ''}
        </div>`;
    };

    $('#dr-q', el).addEventListener('input', (e) => { query = (e.target as HTMLInputElement).value; renderList(); });
    $('#dr-chips', el).addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-g]');
      if (!b) return;
      group = b.dataset.g!;
      el.querySelectorAll('#dr-chips .chip').forEach((c) => c.classList.toggle('on', c === b));
      renderList();
    });
    $('#dr-list', el).addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
      if (!b) return;
      selected = DRUGS.find((d) => d.id === b.dataset.id)!;
      renderList(); renderDetail();
      if (window.innerWidth < 1080) $('#dr-detail', el).scrollIntoView({ behavior: 'smooth' });
    });

    const unsub = patientStore.subscribe(renderDetail);
    renderList(); renderDetail();
    return () => { unsub(); };
  }
};
