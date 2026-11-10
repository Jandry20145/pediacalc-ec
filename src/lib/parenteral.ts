// Nutrición parenteral pediátrica. Port mejorado de Enesimus/web-parenteral-nutrition
// con referencias ESPGHAN/ESPEN/ESPR 2018.
import { hollidaySegar } from './fluids';

export interface NPInput {
  weightKg: number;
  volumeMlKg: number;   // ml/kg/día
  gir: number;          // mg/kg/min
  aa: number;           // g/kg/día
  lipids: number;       // g/kg/día
  na: number;           // mEq/kg/día
  k: number;            // mEq/kg/día
  ca: number;           // mg Ca elemental/kg/día
  p: number;            // mmol/kg/día
  mg: number;           // mEq/kg/día
  zinc: number;         // µg/kg/día (adicional)
  traceElements: boolean;
  vitamins: boolean;
  lipidsSeparate: boolean;
  purgeMl: number;      // volumen de purga / sobrellenado
  naclMeqMl: number;    // 3.4 (20 %) | 1.7 (10 %)
  kclMeqMl: number;     // 2 (14,9 %) | 2.7 (20 %)
  mgMeqMl: number;      // 1.62 (20 %) | 2.03 (25 %)
}

export interface Component { name: string; ml: number; detail: string; group: 'macro' | 'electro' | 'micro' | 'water' }
export interface Alert { level: 'bad' | 'warn' | 'ok'; text: string }

export interface NPResult {
  totalMl: number; prepMl: number; scale: number;
  aqueousMl: number; lipidMl: number;
  rateTotal: number; rateAqueous: number; rateLipid: number;
  components: Component[]; prepComponents: Component[];
  waterMl: number;
  kcal: { glucose: number; protein: number; lipid: number; total: number; perKg: number; npcN: number };
  dextrosePct: number; aaPct: number; osmolarity: number;
  caPhos: number;
  alerts: Alert[];
}

export const CONC = {
  dextrose50: 0.5,     // g/ml
  aa10: 0.1,           // g/ml
  lipid20: 0.2,        // g/ml
  caGluc10: 9.3,       // mg Ca elemental/ml
  glycophos: 1,        // mmol P/ml (aporta 2 mEq Na/ml)
  glycophosNa: 2,
  zinc: 2000,          // µg Zn/ml (sulfato de zinc 0,88 %)
};

export function computeNP(i: NPInput): NPResult {
  const w = i.weightKg;
  const totalMl = i.volumeMlKg * w;

  const glucoseG = i.gir * 1.44 * w;
  const c: Component[] = [];
  const add = (name: string, ml: number, detail: string, group: Component['group']) => {
    if (ml > 0) c.push({ name, ml, detail, group });
  };

  add('Dextrosa 50 %', glucoseG / CONC.dextrose50, `${glucoseG.toFixed(1)} g glucosa`, 'macro');
  add('Aminoácidos 10 % pediátricos', (i.aa * w) / CONC.aa10, `${(i.aa * w).toFixed(1)} g proteína`, 'macro');
  const lipidMl = (i.lipids * w) / CONC.lipid20;
  const pMmol = i.p * w;
  const naFromPhos = pMmol * CONC.glycophosNa;
  const naclMeq = Math.max(0, i.na * w - naFromPhos);
  add(`Cloruro de sodio ${i.naclMeqMl > 2 ? '20' : '10'} %`, naclMeq / i.naclMeqMl, `${naclMeq.toFixed(1)} mEq Na`, 'electro');
  add(`Cloruro de potasio (${i.kclMeqMl} mEq/ml)`, (i.k * w) / i.kclMeqMl, `${(i.k * w).toFixed(1)} mEq K`, 'electro');
  add('Gluconato de calcio 10 %', (i.ca * w) / CONC.caGluc10, `${(i.ca * w).toFixed(0)} mg Ca elemental`, 'electro');
  add('Glicerofosfato sódico (1 mmol/ml)', pMmol / CONC.glycophos, `${pMmol.toFixed(2)} mmol P · ${naFromPhos.toFixed(1)} mEq Na`, 'electro');
  add(`Sulfato de magnesio ${i.mgMeqMl > 1.8 ? '25' : '20'} %`, (i.mg * w) / i.mgMeqMl, `${(i.mg * w).toFixed(2)} mEq Mg`, 'electro');
  add('Sulfato de zinc (2 mg/ml)', (i.zinc * w) / CONC.zinc, `${(i.zinc * w).toFixed(0)} µg Zn`, 'micro');
  if (i.traceElements) add('Oligoelementos pediátricos', Math.min(w * 1, 15), '1 ml/kg (máx. 15 ml)', 'micro');
  if (i.vitamins) {
    add('Vitaminas hidrosolubles (Soluvit)', Math.min(w * 1, 10), '1 ml/kg (máx. 10 ml)', 'micro');
  }
  const vitLipMl = i.vitamins ? Math.min(w * 4, 10) : 0;

  const aqueousSolutes = c.reduce((s, x) => s + x.ml, 0);
  const lipidPhase = lipidMl + vitLipMl;
  const waterMl = totalMl - aqueousSolutes - lipidPhase;
  add('Agua estéril para inyección', Math.max(0, waterMl), 'Para completar volumen', 'water');
  if (lipidMl > 0) c.push({ name: 'Lípidos 20 % (SMOF / MCT-LCT)', ml: lipidMl, detail: `${(i.lipids * w).toFixed(1)} g lípidos`, group: 'macro' });
  if (vitLipMl > 0) c.push({ name: 'Vitaminas liposolubles (Vitalipid)', ml: vitLipMl, detail: '4 ml/kg (máx. 10 ml) en lípidos', group: 'micro' });

  const aqueousMl = totalMl - lipidPhase;
  const prepMl = totalMl + i.purgeMl;
  const scale = prepMl / totalMl;
  const prepComponents = c.map((x) => ({ ...x, ml: x.ml * scale }));

  // Energía
  const kG = glucoseG * 3.4, kP = i.aa * w * 4, kL = i.lipids * w * 10;
  const nG = (i.aa * w) / 6.25;
  const kcal = { glucose: kG, protein: kP, lipid: kL, total: kG + kP + kL, perKg: (kG + kP + kL) / w, npcN: nG > 0 ? (kG + kL) / nG : 0 };

  // Concentraciones (fase acuosa si lípidos separados, total si 3 en 1)
  const base = i.lipidsSeparate ? aqueousMl : totalMl;
  const dextrosePct = (glucoseG / base) * 100;
  const aaPct = ((i.aa * w) / base) * 100;
  const L = base / 1000;
  const caMeq = (i.ca * w) / 20;
  const osmolarity =
    (glucoseG / L) * 5.05 + ((i.aa * w) / L) * 10 +
    ((i.na * w + i.k * w) / L) * 2 + (caMeq / L) * 1.4 + ((i.mg * w) / L) * 1 + (pMmol / L) * 2 +
    (i.lipidsSeparate ? 0 : ((i.lipids * w) / L) * 1.5);
  const caMmolL = ((i.ca * w) / 40) / L;
  const pMmolL = pMmol / L;
  const caPhos = caMmolL + pMmolL;

  const alerts: Alert[] = [];
  if (waterMl < 0) alerts.push({ level: 'bad', text: `El volumen de solutos excede el volumen total en ${(-waterMl).toFixed(0)} ml. Aumente el volumen o reduzca aportes.` });
  if (osmolarity > 900) alerts.push({ level: 'bad', text: `Osmolaridad ≈ ${osmolarity.toFixed(0)} mOsm/l → SOLO VÍA CENTRAL (periférica ≤ 900).` });
  else alerts.push({ level: 'ok', text: `Osmolaridad ≈ ${osmolarity.toFixed(0)} mOsm/l: apta para vía periférica.` });
  if (dextrosePct > 12.5) alerts.push({ level: 'warn', text: `Dextrosa ${dextrosePct.toFixed(1)} % > 12,5 %: requiere vía central.` });
  if (i.gir > 12) alerts.push({ level: 'warn', text: 'VIG > 12 mg/kg/min: riesgo de hiperglucemia y esteatosis.' });
  if (i.gir < 4 && w < 10) alerts.push({ level: 'warn', text: 'VIG < 4 mg/kg/min en lactante: riesgo de hipoglucemia.' });
  if (aaPct < 2 && i.aa > 0 && !i.lipidsSeparate) alerts.push({ level: 'warn', text: `Concentración de AA ${aaPct.toFixed(2)} % < 2 %: riesgo de inestabilidad de la emulsión 3 en 1.` });
  if (caPhos > 30) alerts.push({ level: 'bad', text: `Ca + P = ${caPhos.toFixed(1)} mmol/l: riesgo de precipitación. Ajuste o use fosfato orgánico.` });
  if (kcal.npcN > 0 && (kcal.npcN < 100 || kcal.npcN > 250)) alerts.push({ level: 'warn', text: `Relación kcal no proteicas/g N = ${kcal.npcN.toFixed(0)} (ideal 150–250).` });
  if (i.lipids > 4) alerts.push({ level: 'bad', text: 'Lípidos > 4 g/kg/día excede el máximo recomendado.' });
  const kMeqL = (i.k * w) / L;
  if (kMeqL > 80) alerts.push({ level: 'bad', text: `Potasio ${kMeqL.toFixed(0)} mEq/l: excede 80 mEq/l (vía central) / 40 mEq/l (periférica).` });
  else if (kMeqL > 40) alerts.push({ level: 'warn', text: `Potasio ${kMeqL.toFixed(0)} mEq/l > 40 mEq/l: solo vía central.` });

  return {
    totalMl, prepMl, scale, aqueousMl, lipidMl: lipidPhase,
    rateTotal: totalMl / 24, rateAqueous: aqueousMl / 24, rateLipid: lipidPhase / 24,
    components: c, prepComponents, waterMl, kcal, dextrosePct, aaPct, osmolarity, caPhos, alerts
  };
}

/** Valores iniciales sugeridos por edad (ESPGHAN 2018, adaptados) */
export function npDefaults(weightKg: number, ageMonths: number | null): Partial<NPInput> {
  const m = ageMonths ?? (weightKg < 4 ? 0 : weightKg < 10 ? 6 : 36);
  const hs = Math.round(hollidaySegar(weightKg) / weightKg);
  if (m < 1) return { volumeMlKg: 150, gir: 6, aa: 3, lipids: 3, na: 3, k: 2, ca: 40, p: 1.5, mg: 0.3, zinc: 250 };
  if (m < 12) return { volumeMlKg: Math.max(hs, 100), gir: 7, aa: 2.5, lipids: 3, na: 3, k: 2, ca: 20, p: 0.7, mg: 0.2, zinc: 100 };
  if (m < 72) return { volumeMlKg: hs, gir: 6, aa: 1.5, lipids: 2.5, na: 3, k: 2, ca: 10, p: 0.5, mg: 0.15, zinc: 50 };
  if (m < 144) return { volumeMlKg: hs, gir: 4, aa: 1.5, lipids: 2, na: 2, k: 1.5, ca: 8, p: 0.3, mg: 0.1, zinc: 50 };
  return { volumeMlKg: hs, gir: 3, aa: 1.2, lipids: 2, na: 2, k: 1, ca: 5, p: 0.3, mg: 0.1, zinc: 50 };
}
