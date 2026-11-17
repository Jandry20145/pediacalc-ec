import { icon, type View } from '../ui';
import { DRUGS } from '../data/drugs';
import { spotlightSVG, playSpotlight, textGenerate, counters, hoverHighlight } from '../fx';

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

// Pequeñas ilustraciones SVG para el bento
const ART = {
  curves: `<svg class="art" viewBox="0 0 200 120" fill="none">
    ${[[-3, '#8a8f98'], [-2, '#ef4444'], [0, '#22c55e'], [2, '#ef4444'], [3, '#8a8f98']].map(([z, c]) =>
      `<path d="M0 ${110 - 16 * (+z + 3)} C 60 ${80 - 14 * (+z + 3)}, 120 ${60 - 12 * (+z + 3)}, 200 ${40 - 10 * (+z + 3)}" stroke="${c}" stroke-opacity=".55" stroke-width="1.6" ${Math.abs(+z) === 3 ? 'stroke-dasharray="4 4"' : ''}/>`).join('')}
    <circle cx="128" cy="47" r="5" fill="var(--brand)" stroke="var(--surface-solid)" stroke-width="2"/></svg>`

};

const TILES = [
  { href: 'farmacos', ic: 'pill', t: 'Vademécum pediátrico', cls: 'wide',
    d: 'Dosis por peso y edad con presentaciones del CNMB. Respeta máximos por toma y por día y calcula los ml exactos.',
    chips: ['Antibióticos', 'Antipiréticos', 'Respiratorio', 'Emergencia'] },
  { href: 'crecimiento', ic: 'chart', t: 'Curvas OMS', cls: 'tall', art: 'curves',
    d: 'P/E, T/E, IMC/E y P/T con puntuación Z de 0 a 19 años. Detecta desnutrición crónica, emaciación y sobrepeso.' },
  { href: 'liquidos', ic: 'drop', t: 'Líquidos y goteo',
    d: 'Holliday-Segar, superficie corporal, gotas/min, VIG y preparación de soluciones isotónicas.' },
  { href: 'deshidratacion', ic: 'dehy', t: 'Deshidratación',
    d: 'Evaluación AIEPI y Planes A, B y C del MSP con volúmenes y goteo.' },
  { href: 'parenteral', ic: 'flask', t: 'Nutrición parenteral', cls: 'wide',
    d: 'Prescripción NPT con osmolaridad, compatibilidad Ca/P, kcal/kg, alertas y hoja de preparación imprimible.',
    chips: ['ESPGHAN 2018', 'Vía central/periférica', 'Hoja imprimible'] }
];

export const homeView: View = {
  title: 'Inicio',
  mount(el) {
    el.innerHTML = `
      <section class="hero-x" data-reveal>
        ${spotlightSVG()}
        <div class="hero-grid">
          <div>
            <span class="hero-badge"><b>MSP</b> Protocolos AIEPI · OMS · ESPGHAN</span>
            <h1 class="hero-title" id="hero-title">Calculadora pediátrica precisa, <span class="grad">incluso sin internet.</span></h1>
            <p class="hero-sub">Dosis, líquidos, rehidratación, crecimiento y nutrición parenteral según el peso exacto del niño.
            Pensada para los centros de salud rurales del Ecuador.</p>
            <div class="hero-ctas">
              <a class="btn-glow" href="#/farmacos"><span>${icon('pill')}Calcular una dosis</span></a>
              <a class="btn-ghost" href="#/crecimiento">${icon('chart')}Evaluar crecimiento</a>
            </div>
          </div>
          <div class="hero-visual" aria-hidden="true">
            <div class="ring"></div><div class="ring r2"></div><div class="ring r3"></div>
            <img src="logo.png" alt="">
            <span class="orbit" style="top:8%;left:-4%">${icon('drop')}Holliday-Segar</span>
            <span class="orbit" style="top:44%;right:-8%">${icon('chart')}Z-score OMS</span>
            <span class="orbit" style="bottom:6%;left:6%">${icon('ok')}100 % offline</span>
          </div>
        </div>
        <div class="stats">
          <div><strong data-count="${DRUGS.length}">${DRUGS.length}</strong><span>fármacos con presentaciones</span></div>
          <div><strong data-count="19" data-suffix=" años">19 años</strong><span>de referencia OMS</span></div>
          <div><strong data-count="5">5</strong><span>módulos clínicos</span></div>
          <div><strong data-count="100" data-suffix=" %">100 %</strong><span>funciona sin conexión</span></div>
        </div>
      </section>

      <div class="section-title" data-reveal><div><h2>Módulos clínicos</h2><p>Todos comparten los datos del paciente: ingréselos una sola vez.</p></div></div>
      <div class="bento" id="bento">
        ${TILES.map((t) => `<a class="tile ${t.cls ?? ''}" href="#/${t.href}">
          ${t.art ? ART[t.art as keyof typeof ART] : ''}
          <div class="ic">${icon(t.ic)}</div><span class="go">${arrow}</span>
          <strong>${t.t}</strong><span>${t.d}</span>
          ${t.chips ? `<div class="chiplist">${t.chips.map((c) => `<i>${c}</i>`).join('')}</div>` : ''}
        </a>`).join('')}
      </div>

      <div class="grid cols-2" style="margin-top:22px">
        <div class="card">
          <h3>${icon('info')} Cómo usar</h3>
          <div class="timeline">
            <div><b>Registre al paciente</b><span>Peso, talla, sexo y edad en la barra superior; se comparten entre módulos.</span></div>
            <div><b>Elija el cálculo</b><span>Los resultados se actualizan al instante mientras escribe.</span></div>
            <div><b>Instale la app</b><span>Menú del navegador → <i>Instalar / Agregar a pantalla de inicio</i> para usarla sin señal.</span></div>
          </div>
        </div>
        <div class="card">
          <h3>${icon('warn')} Seguridad del paciente</h3>
          <p class="small muted" style="margin:0 0 12px">Los datos se guardan solo en este dispositivo y no incluyen nombre ni cédula.
          Las dosis respetan máximos por toma y por día; confirme siempre con la prescripción y el CNMB vigente.</p>
          <div class="chips" style="margin:0"><span class="tag ok">Sin datos personales</span><span class="tag">Máximos por dosis</span><span class="tag warn">Requiere validación clínica</span></div>
        </div>
      </div>`;

    textGenerate(el.querySelector('#hero-title')!);
    playSpotlight(el);
    counters(el);
    hoverHighlight(el.querySelector('#bento')!, '.tile');
  }
};
