import './styles/main.css';
import { registerSW } from 'virtual:pwa-register';
import { icon, type View } from './ui';
import { mountPatientBar } from './patientBar';
import { homeView } from './views/home';
import { fluidsView } from './views/fluids';
import { dehydrationView } from './views/dehydration';
import { drugsView } from './views/drugs';
import { growthView } from './views/growth';
import { parenteralView } from './views/parenteral';

const ROUTES: { path: string; label: string; short: string; icon: string; view: View }[] = [
  { path: '', label: 'Inicio', short: 'Inicio', icon: 'home', view: homeView },
  { path: 'liquidos', label: 'Líquidos y goteo', short: 'Líquidos', icon: 'drop', view: fluidsView },
  { path: 'deshidratacion', label: 'Deshidratación', short: 'Deshidr.', icon: 'dehy', view: dehydrationView },
  { path: 'farmacos', label: 'Fármacos', short: 'Fármacos', icon: 'pill', view: drugsView },
  { path: 'crecimiento', label: 'Curvas OMS', short: 'Curvas', icon: 'chart', view: growthView },
  { path: 'parenteral', label: 'Nutrición parenteral', short: 'NPT', icon: 'flask', view: parenteralView }
];

const app = document.getElementById('app')!;
app.innerHTML = `
<div class="app">
  <aside class="sidebar">
    <a class="brand" href="#/"><img src="logo.png" alt="Logo PediaCalc"><div><strong>PediaCalc EC</strong><small>Calculadora pediátrica</small></div></a>
    <nav class="nav">${ROUTES.map((r) => `<a href="#/${r.path}" data-r="${r.path}">${icon(r.icon)}<span>${r.label}</span></a>`).join('')}</nav>
    <div class="foot">
      <span class="status-pill" data-net>En línea</span>
      <button class="btn sm ghost" id="theme" style="justify-content:flex-start">${icon('moon')}<span>Tema claro/oscuro</span></button>
      <span>Guías: MSP Ecuador · AIEPI · OMS · ESPGHAN</span>
    </div>
  </aside>
  <main class="main">
    <div class="topbar-mobile"><img src="logo.png" alt=""><strong>PediaCalc EC</strong><span class="status-pill" data-net>En línea</span></div>
    <div id="patient"></div>
    <div id="view"></div>
    <p class="disclaimer">⚠️ Herramienta de apoyo a la decisión clínica. No sustituye el juicio médico ni la normativa vigente del MSP del Ecuador.
    Verifique dosis, concentraciones y presentaciones disponibles en su establecimiento antes de administrar.</p>
  </main>
  <nav class="bottom-nav">${ROUTES.map((r) => `<a href="#/${r.path}" data-r="${r.path}">${icon(r.icon)}<span>${r.short}</span></a>`).join('')}</nav>
</div>`;

mountPatientBar(document.getElementById('patient')!);

const viewEl = document.getElementById('view')!;
let cleanup: (() => void) | void;

function route() {
  const path = location.hash.replace(/^#\/?/, '').split('?')[0];
  const r = ROUTES.find((x) => x.path === path) ?? ROUTES[0];
  if (cleanup) cleanup();
  const host = document.createElement('div');
  viewEl.replaceChildren(host); // contenedor nuevo: elimina listeners de la vista anterior
  cleanup = r.view.mount(host);
  document.title = r.path ? `${r.label} · PediaCalc EC` : 'PediaCalc EC — Calculadora pediátrica';
  document.querySelectorAll<HTMLAnchorElement>('[data-r]').forEach((a) => a.classList.toggle('active', a.dataset.r === r.path));
  document.getElementById('patient')!.style.display = r.path === '' ? 'none' : '';
  window.scrollTo({ top: 0 });
}
window.addEventListener('hashchange', route);
route();

// Estado de red
const net = () => document.querySelectorAll<HTMLElement>('[data-net]').forEach((el) => {
  el.textContent = navigator.onLine ? 'En línea' : 'Sin conexión · modo offline';
  el.classList.toggle('off', !navigator.onLine);
});
window.addEventListener('online', net);
window.addEventListener('offline', net);
net();

// Tema
const THEME_KEY = 'pediacalc.theme';
try { const t = localStorage.getItem(THEME_KEY); if (t) document.documentElement.dataset.theme = t; } catch { /* */ }
document.getElementById('theme')!.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  const next = dark ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch { /* */ }
});

registerSW({ immediate: true });
