# PediaCalc EC — Plan de implementación en 8 fases

Calculadora pediátrica offline (PWA) adaptada a los protocolos del MSP del Ecuador
(AIEPI / Atención Integral a las Enfermedades Prevalentes de la Infancia, Cuadro
Nacional de Medicamentos Básicos – CNMB, normas de crecimiento OMS adoptadas por el MSP).

Repositorio de referencia: `Enesimus/web-parenteral-nutrition` (HTML + jQuery, solo NPT,
fórmulas acopladas al DOM, sin validaciones, sin offline). Esta versión lo reescribe en
TypeScript con un motor de cálculo puro y testeado, separado de la interfaz.

| Fase | Entregable | Estado |
|---|---|---|
| 1 | Fundaciones: Vite + TypeScript + PWA, sistema de diseño, logo, navegación | ✅ Implementada |
| 2 | Contexto del paciente compartido + motor clínico base | ✅ Implementada |
| 3 | Líquidos de mantenimiento, goteos y electrolitos | ✅ Implementada |
| 4 | Deshidratación: Planes A/B/C (AIEPI) y déficit hospitalario | ✅ Implementada |
| 5 | Vademécum pediátrico con dosis por peso | ✅ Implementada |
| 6 | Curvas de crecimiento OMS con puntuación Z y diagnóstico nutricional | ✅ Implementada |
| 7 | Nutrición parenteral pediátrica (mejora del repo de referencia) | ✅ Implementada |
| 8 | Calidad, validación clínica, despliegue y capacitación | 🟡 Parcial (tests + build listos; falta validación clínica y despliegue) |

---

## Fase 1 — Fundaciones
**Objetivo:** base técnica que funcione sin internet en los subcentros rurales (Tarqui, Victoria del Portete, etc.).
- Vite + TypeScript estricto, sin frameworks pesados (bundle pequeño → carga rápida en 3G).
- `vite-plugin-pwa` (Workbox): precache de todo el shell y los datos OMS; actualización automática.
- Manifest con el logo institucional, íconos 192/512 y *maskable*, instalable en Android.
- Sistema de diseño propio (tokens CSS, modo claro/oscuro, alto contraste, táctil ≥ 44 px).
- Navegación por hash (`#/liquidos`, `#/farmacos`…) que funciona offline.

**Criterio de aceptación:** la app se instala y abre en modo avión.

## Fase 2 — Contexto del paciente y motor clínico
- Barra de paciente única (peso, talla, sexo, fecha de nacimiento o edad) compartida por todos los módulos y guardada localmente (`localStorage`, sin datos identificatorios).
- Cálculo de edad exacta (días / meses / años), superficie corporal (Mosteller y fórmula sin talla), categoría (neonato, lactante, preescolar, escolar, adolescente).
- Validaciones de rango (peso 0,4–150 kg, talla 30–200 cm) con alertas visibles.
- Funciones puras en `src/lib/` (sin DOM) → testeables.

## Fase 3 — Líquidos y goteos
- Holliday-Segar (100/50/20) y método por superficie corporal (1500–2000 ml/m²/día).
- Ajustes: restricción (⅔ o 75 %), fiebre (+12 %/°C), aumentos por pérdidas.
- Velocidad en ml/h y goteo: macrogotero (20 gtt/ml), microgotero (60 µgtt/ml) y factor personalizado.
- Composición sugerida de solución isotónica (Dextrosa 5 % + NaCl 0,9 % + KCl) con aportes de Na/K y glucosa (mg/kg/min).
- Calculadora inversa: “tengo X ml en Y horas → ¿cuántas gotas?”.

## Fase 4 — Deshidratación
- Evaluación clínica guiada AIEPI (signos → Sin deshidratación / Algún grado / Grave).
- **Plan A:** SRO por deposición (< 2 a: 50–100 ml; ≥ 2 a: 100–200 ml) + zinc.
- **Plan B:** SRO 75 ml/kg en 4 h.
- **Plan C:** Lactato de Ringer/SS 0,9 % 100 ml/kg: < 12 m 30 ml/kg en 1 h + 70 ml/kg en 5 h; ≥ 12 m 30 ml/kg en 30 min + 70 ml/kg en 2,5 h.
- Método hospitalario: déficit (% × peso × 10) + mantenimiento en 24 h, con reposición 50 % en 8 h y 50 % en 16 h.

## Fase 5 — Vademécum pediátrico
- Base de datos tipada de fármacos frecuentes (antibióticos, antipiréticos/analgésicos, broncodilatadores, corticoides, antiparasitarios, antieméticos, micronutrientes y emergencia).
- Presentaciones comerciales habituales en Ecuador (CNMB) → dosis en mg y volumen en ml.
- Respeto de dosis máxima por toma/día, alertas de rango, búsqueda y filtros por grupo.
- Fichas con vía, intervalo, duración y observaciones (p. ej. ajuste renal).

## Fase 6 — Curvas OMS
- Tablas LMS oficiales: Patrones OMS 2006 (0–5 a) y Referencia OMS 2007 (5–19 a), embebidas offline.
- Indicadores: Peso/Edad, Talla/Edad, IMC/Edad, Peso/Talla (0–5 a).
- Puntuación Z (método LMS con corrección OMS > ±3 DE) y percentil.
- Clasificación MSP/OMS: baja talla (desnutrición crónica), emaciación, sobrepeso, obesidad.
- Gráfico SVG con bandas −3…+3 DE y el punto del paciente; registro de controles sucesivos.

## Fase 7 — Nutrición parenteral
- Port y corrección de las fórmulas del repositorio de referencia (glucosa 50 %, AA 10 %, lípidos 20 %, NaCl 10 %, KCl 10 %, gluconato de Ca 10 %, MgSO₄, fosfato, oligoelementos, vitaminas, agua).
- Volumen a preparar con purga, VIG (mg/kg/min), kcal/kg, relación kcal no proteicas/g N.
- Osmolaridad estimada → alerta “solo vía central” si > 900 mOsm/l (periférica ≤ 900).
- Compatibilidad Ca/P, concentración de AA y lípidos, agua libre negativa → alertas.
- Hoja de preparación imprimible.

## Fase 8 — Calidad, validación y despliegue
- ✅ Pruebas unitarias del motor clínico (Vitest).
- ✅ Build de producción con Service Worker.
- ⏳ Revisión por pediatras del MSP / Hospital Vicente Corral Moscoso de cada dosis y fórmula; firma de versión.
- ⏳ Despliegue en hosting estático (GitHub Pages / Netlify / Cloudflare Pages) con HTTPS (requisito PWA).
- ⏳ Pruebas de campo en subcentros rurales de Cuenca (dispositivos Android de gama baja, sin señal).
- ⏳ Capacitación breve al personal y canal de reporte de errores.
- ⏳ Futuro: exportar a PDF, historial de controles por niño con cifrado local, calculadora de emergencias (RCP/intubación), score de Downes/Silverman.

> ⚠️ Herramienta de apoyo a la decisión clínica. No reemplaza el juicio médico ni la
> normativa vigente del MSP. Verificar siempre dosis y concentraciones antes de administrar.
