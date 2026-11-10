import { icon, type View } from '../ui';

const TILES = [
  { href: 'liquidos', ic: 'drop', t: 'Líquidos y goteo', d: 'Holliday-Segar, superficie corporal, gotas/min, VIG y preparación de soluciones.' },
  { href: 'deshidratacion', ic: 'dehy', t: 'Deshidratación', d: 'Evaluación AIEPI y Planes A, B y C del MSP; déficit hospitalario.' },
  { href: 'farmacos', ic: 'pill', t: 'Fármacos', d: 'Más de 35 fármacos: antibióticos, antipiréticos, respiratorio y emergencia con ml por toma.' },
  { href: 'crecimiento', ic: 'chart', t: 'Curvas OMS', d: 'P/E, T/E, IMC/E y P/T con puntuación Z. Detecta desnutrición crónica y sobrepeso.' },
  { href: 'parenteral', ic: 'flask', t: 'Nutrición parenteral', d: 'Prescripción NPT con osmolaridad, Ca/P, kcal y hoja de preparación.' }
];

export const homeView: View = {
  title: 'Inicio',
  mount(el) {
    el.innerHTML = `
      <section class="hero">
        <img src="logo.png" alt="Logo">
        <div>
          <h1>Calculadora Pediátrica — PediaCalc EC</h1>
          <p>Dosis, líquidos, rehidratación, crecimiento y nutrición parenteral según el peso exacto del niño.
          Adaptada a protocolos del MSP del Ecuador y funciona <b>sin internet</b> en los centros de salud rurales.</p>
        </div>
      </section>
      <div class="tiles">
        ${TILES.map((t) => `<a class="tile" href="#/${t.href}"><div class="ic">${icon(t.ic)}</div><strong>${t.t}</strong><span>${t.d}</span></a>`).join('')}
      </div>
      <div class="grid cols-2" style="margin-top:16px">
        <div class="card">
          <h3>${icon('info')} Cómo usar</h3>
          <ol class="small muted" style="margin:0;padding-left:18px;display:grid;gap:4px">
            <li>Ingrese peso, talla, sexo y edad en la barra <b>Paciente</b> (se comparte entre módulos).</li>
            <li>Elija el módulo de cálculo. Los resultados se actualizan al instante.</li>
            <li>Instale la app (menú del navegador → <i>Instalar / Agregar a pantalla de inicio</i>) para usarla offline.</li>
          </ol>
        </div>
        <div class="card">
          <h3>${icon('warn')} Seguridad del paciente</h3>
          <p class="small muted" style="margin:0">Los datos se guardan solo en este dispositivo y no incluyen nombre ni cédula.
          Las dosis respetan máximos por toma y por día; siempre confirme con la prescripción y el CNMB vigente.</p>
        </div>
      </div>`;
  }
};
