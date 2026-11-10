# PediaCalc EC — Calculadora Pediátrica (PWA offline)

Calculadora clínica pediátrica adaptada a los protocolos del MSP del Ecuador, pensada para
centros de salud rurales de Cuenca (Tarqui, Victoria del Portete…) con conectividad intermitente.
Inspirada en [Enesimus/web-parenteral-nutrition](https://github.com/Enesimus/web-parenteral-nutrition), reescrita y ampliada.

## Módulos
- **Líquidos y goteo:** Holliday-Segar, 4-2-1, superficie corporal, ajuste por fiebre/restricción, gotas/min, VIG y preparación de soluciones.
- **Deshidratación:** evaluación AIEPI y Planes A, B, C; reposición hospitalaria por déficit.
- **Fármacos:** vademécum con dosis por peso/edad, máximos por toma y por día, ml por presentación (CNMB).
- **Curvas OMS:** P/E, T/E, IMC/E, P/T con puntuación Z, percentil, clasificación MSP y registro de controles.
- **Nutrición parenteral:** prescripción, osmolaridad, Ca/P, kcal, alertas y hoja de preparación imprimible.

## Uso
```bash
npm install
npm run dev      # desarrollo
npm test         # pruebas del motor clínico
npm run build    # build de producción en dist/ (con Service Worker)
```
Publique `dist/` en cualquier hosting estático con HTTPS (GitHub Pages, Netlify, Cloudflare Pages) e instale la app
desde el navegador del teléfono para usarla sin internet.

## Estructura
- `src/lib/` motor clínico puro (sin DOM) y testeado: `fluids`, `growth`, `dosing`, `parenteral`, `patient`.
- `src/data/` vademécum y tablas LMS OMS (2006 y 2007) embebidas.
- `src/views/` interfaz de cada módulo.
- `PLAN_IMPLEMENTACION.md` plan de implementación en 8 fases.

> ⚠️ Herramienta de apoyo. No reemplaza el juicio clínico ni la normativa vigente del MSP. Requiere validación por pediatras antes de su uso asistencial.

## Docker
Cada push a `main` publica la imagen en GitHub Container Registry (amd64 y arm64):
```bash
docker run -d -p 8080:80 --name pediacalc ghcr.io/jandry20145/pediacalc-ec:latest
```
o con `docker compose up -d`. Luego abra http://localhost:8080.
