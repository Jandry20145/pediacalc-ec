import { WHO_LMS, type LMSRow } from '../data/who-lms';
import type { Sex } from './patient';

export type Indicator = 'wfa' | 'lhfa' | 'bmi' | 'wfh';

export const INDICATORS: Record<Indicator, { name: string; short: string; unit: string; xUnit: string }> = {
  wfa: { name: 'Peso para la edad', short: 'P/E', unit: 'kg', xUnit: 'meses' },
  lhfa: { name: 'Longitud/Talla para la edad', short: 'T/E', unit: 'cm', xUnit: 'meses' },
  bmi: { name: 'IMC para la edad', short: 'IMC/E', unit: 'kg/m²', xUnit: 'meses' },
  wfh: { name: 'Peso para la longitud/talla', short: 'P/T', unit: 'kg', xUnit: 'cm' }
};

export function table(ind: Indicator, sex: Sex, ageMonths?: number): LMSRow[] {
  if (ind === 'wfh') return WHO_LMS[(ageMonths != null && ageMonths < 24 ? 'wfl_' : 'wfh_') + sex];
  return WHO_LMS[ind + '_' + sex];
}

/** Interpolación lineal de L, M, S en x */
export function lmsAt(rows: LMSRow[], x: number): [number, number, number] | null {
  if (x < rows[0][0] || x > rows[rows.length - 1][0]) return null;
  let lo = 0, hi = rows.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (rows[mid][0] <= x) lo = mid; else hi = mid; }
  const a = rows[lo], b = rows[hi];
  if (a[0] === x || a === b) return [a[1], a[2], a[3]];
  const t = (x - a[0]) / (b[0] - a[0]);
  return [a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2]), a[3] + t * (b[3] - a[3])];
}

const valueAtZ = (L: number, M: number, S: number, z: number) =>
  L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);

/**
 * Puntuación Z por método LMS. Para indicadores de peso/IMC aplica la
 * corrección OMS más allá de ±3 DE (distribución con asimetría).
 */
export function zScore(L: number, M: number, S: number, y: number, restricted: boolean): number {
  let z = L === 0 ? Math.log(y / M) / S : (Math.pow(y / M, L) - 1) / (L * S);
  if (!restricted || Math.abs(z) <= 3) return z;
  if (z > 3) {
    const sd3 = valueAtZ(L, M, S, 3), sd23 = sd3 - valueAtZ(L, M, S, 2);
    return 3 + (y - sd3) / sd23;
  }
  const sd3n = valueAtZ(L, M, S, -3), sd23n = valueAtZ(L, M, S, -2) - sd3n;
  return -3 + (y - sd3n) / sd23n;
}

export function curveValue(L: number, M: number, S: number, z: number) { return valueAtZ(L, M, S, z); }

/** Percentil a partir de Z (aprox. normal estándar) */
export function percentile(z: number): number {
  // Abramowitz–Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  const cdf = 0.5 * (1 + Math.sign(z) * erf);
  return cdf * 100;
}

export type Severity = 'ok' | 'warn' | 'bad' | 'info';
export interface Classification { label: string; severity: Severity }

/** Clasificación según normas OMS adoptadas por el MSP Ecuador */
export function classify(ind: Indicator, z: number, ageMonths: number): Classification {
  const under5 = ageMonths < 60;
  switch (ind) {
    case 'lhfa':
      if (z < -3) return { label: 'Baja talla severa (desnutrición crónica severa)', severity: 'bad' };
      if (z < -2) return { label: 'Baja talla (desnutrición crónica)', severity: 'bad' };
      if (z > 3) return { label: 'Muy alto para la edad (descartar endocrinopatía)', severity: 'warn' };
      return { label: 'Talla normal', severity: 'ok' };
    case 'wfa':
      if (z < -3) return { label: 'Peso muy bajo / bajo peso severo', severity: 'bad' };
      if (z < -2) return { label: 'Bajo peso (desnutrición global)', severity: 'bad' };
      if (z > 1) return { label: 'Posible problema de crecimiento → valorar IMC/E o P/T', severity: 'warn' };
      return { label: 'Peso adecuado para la edad', severity: 'ok' };
    case 'wfh':
    case 'bmi':
      if (under5) {
        if (z < -3) return { label: 'Emaciación severa (desnutrición aguda severa)', severity: 'bad' };
        if (z < -2) return { label: 'Emaciación (desnutrición aguda moderada)', severity: 'bad' };
        if (z > 3) return { label: 'Obesidad', severity: 'bad' };
        if (z > 2) return { label: 'Sobrepeso', severity: 'warn' };
        if (z > 1) return { label: 'Riesgo de sobrepeso', severity: 'warn' };
        return { label: 'Normal', severity: 'ok' };
      }
      if (z < -3) return { label: 'Delgadez severa', severity: 'bad' };
      if (z < -2) return { label: 'Delgadez', severity: 'bad' };
      if (z > 2) return { label: 'Obesidad', severity: 'bad' };
      if (z > 1) return { label: 'Sobrepeso', severity: 'warn' };
      return { label: 'Normal', severity: 'ok' };
  }
}

export interface Assessment {
  indicator: Indicator; x: number; y: number; z: number; pct: number; cls: Classification;
}

export function assess(ind: Indicator, sex: Sex, ageMonths: number, weightKg: number | null, heightCm: number | null): Assessment | null {
  let x: number, y: number | null;
  if (ind === 'wfh') {
    if (ageMonths >= 60 || heightCm == null || weightKg == null) return null;
    x = heightCm; y = weightKg;
  } else {
    x = ageMonths;
    if (ind === 'wfa') y = weightKg;
    else if (ind === 'lhfa') y = heightCm;
    else y = weightKg && heightCm ? weightKg / (heightCm / 100) ** 2 : null;
  }
  if (y == null || !(y > 0)) return null;
  const lms = lmsAt(table(ind, sex, ageMonths), x);
  if (!lms) return null;
  const z = zScore(lms[0], lms[1], lms[2], y, ind !== 'lhfa');
  return { indicator: ind, x, y, z, pct: percentile(z), cls: classify(ind, z, ageMonths) };
}
