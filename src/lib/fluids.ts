// Líquidos de mantenimiento, goteos y deshidratación (AIEPI / MSP Ecuador)

/** Holliday-Segar: ml/día */
export function hollidaySegar(weightKg: number): number {
  if (weightKg <= 10) return weightKg * 100;
  if (weightKg <= 20) return 1000 + (weightKg - 10) * 50;
  return Math.min(1500 + (weightKg - 20) * 20, 2400);
}

/** Regla 4-2-1: ml/h */
export function rule421(weightKg: number): number {
  if (weightKg <= 10) return weightKg * 4;
  if (weightKg <= 20) return 40 + (weightKg - 10) * 2;
  return Math.min(60 + (weightKg - 20), 100);
}

/** Por superficie corporal: ml/día */
export const byBSA = (bsaM2: number, mlPerM2 = 1500): number => bsaM2 * mlPerM2;

export interface DripResult { mlPerHour: number; dropsPerMin: number; secondsPerDrop: number }

/** Volumen (ml) en horas → ml/h y gotas/min con factor gotero (gtt/ml) */
export function drip(volumeMl: number, hours: number, dropFactor: number): DripResult {
  const mlPerHour = volumeMl / hours;
  const dropsPerMin = (mlPerHour * dropFactor) / 60;
  return { mlPerHour, dropsPerMin, secondsPerDrop: dropsPerMin > 0 ? 60 / dropsPerMin : Infinity };
}

/** Velocidad de infusión de glucosa (mg/kg/min) */
export function gir(dextrosePct: number, mlPerHour: number, weightKg: number): number {
  return (dextrosePct * mlPerHour * 10) / (60 * weightKg);
}

export interface Maintenance {
  dailyMl: number; mlPerHour: number; method: string;
  naMeqDay: number; kMeqDay: number;
}

export interface MaintenanceOpts {
  method: 'hs' | 'bsa';
  bsaM2?: number;
  /** factor de ajuste (1 = 100 %, 0.66 = restricción 2/3) */
  factor: number;
  feverC?: number; // temperatura máx; +12 % por cada °C > 38
}

export function maintenance(weightKg: number, o: MaintenanceOpts): Maintenance {
  let base = o.method === 'bsa' && o.bsaM2 ? byBSA(o.bsaM2) : hollidaySegar(weightKg);
  let factor = o.factor;
  if (o.feverC && o.feverC > 38) factor *= 1 + 0.12 * (o.feverC - 38);
  const dailyMl = base * factor;
  return {
    dailyMl,
    mlPerHour: dailyMl / 24,
    method: o.method === 'bsa' ? 'Superficie corporal (1500 ml/m²)' : 'Holliday-Segar',
    // Requerimientos basales: Na 3 mEq/100 ml, K 2 mEq/100 ml (o 2–3 / 1–2 mEq/kg/d)
    naMeqDay: (dailyMl / 100) * 3,
    kMeqDay: (dailyMl / 100) * 2
  };
}

/** Preparación de una solución de volumen V con Na y K deseados (mEq/l) */
export interface SolutionRecipe {
  totalMl: number; dextroseMl: number; naclMl: number; kclMl: number;
  dextrosePct: number; naMeqL: number; kMeqL: number;
}
/**
 * Prepara una solución a partir de Dextrosa 5 % en agua + ampollas de electrolitos.
 * Concentraciones habituales: NaCl 20 % = 3,4 mEq/ml (10 % = 1,7); KCl 2 mEq/ml (o 20 % = 2,7).
 */
export function solutionRecipe(
  totalMl: number, naMeqL: number, kMeqL: number, naclMeqMl = 3.4, kclMeqMl = 2
): SolutionRecipe {
  const naclMl = ((totalMl / 1000) * naMeqL) / naclMeqMl;
  const kclMl = ((totalMl / 1000) * kMeqL) / kclMeqMl;
  const dextroseMl = totalMl - kclMl - naclMl;
  return { totalMl, dextroseMl, naclMl, kclMl, dextrosePct: (5 * dextroseMl) / totalMl, naMeqL, kMeqL };
}

// ---------------- Deshidratación ----------------
export type DehydrationLevel = 'none' | 'some' | 'severe';

export interface Sign { id: string; label: string; level: 'some' | 'severe' }
/** Signos AIEPI: ≥ 2 signos del grupo → clasificación */
export const AIEPI_SIGNS: Sign[] = [
  { id: 'letargico', label: 'Letárgico o inconsciente', level: 'severe' },
  { id: 'nobebe', label: 'No puede beber o bebe muy mal', level: 'severe' },
  { id: 'pliegueMuyLento', label: 'Pliegue cutáneo regresa muy lentamente (> 2 s)', level: 'severe' },
  { id: 'ojosHundidosG', label: 'Ojos hundidos', level: 'severe' },
  { id: 'llenadoCapilar', label: 'Llenado capilar > 3 s / pulso débil', level: 'severe' },
  { id: 'intranquilo', label: 'Intranquilo, irritable', level: 'some' },
  { id: 'bebeAvido', label: 'Bebe ávidamente, con sed', level: 'some' },
  { id: 'pliegueLento', label: 'Pliegue cutáneo regresa lentamente', level: 'some' },
  { id: 'ojosHundidosA', label: 'Ojos hundidos (con irritabilidad / sed)', level: 'some' }
];

export function classifyDehydration(checked: Set<string>): DehydrationLevel {
  const count = (lvl: 'some' | 'severe') => AIEPI_SIGNS.filter((s) => s.level === lvl && checked.has(s.id)).length;
  if (count('severe') >= 2) return 'severe';
  if (count('severe') + count('some') >= 2) return 'some';
  return 'none';
}

export interface PlanStep { label: string; volumeMl: number; hours: number; fluid: string }

export function planA(ageMonths: number) {
  const under2 = ageMonths < 24;
  return {
    sroPerStool: under2 ? '50–100 ml' : '100–200 ml',
    zinc: ageMonths < 6 ? '10 mg/día × 10–14 días' : '20 mg/día × 10–14 días'
  };
}

export function planB(weightKg: number): PlanStep[] {
  return [{ label: 'SRO (Sales de Rehidratación Oral)', volumeMl: 75 * weightKg, hours: 4, fluid: 'SRO baja osmolaridad' }];
}

export function planC(weightKg: number, ageMonths: number): PlanStep[] {
  const infant = ageMonths < 12;
  return [
    { label: 'Primero 30 ml/kg', volumeMl: 30 * weightKg, hours: infant ? 1 : 0.5, fluid: 'Lactato de Ringer (o SS 0,9 %)' },
    { label: 'Luego 70 ml/kg', volumeMl: 70 * weightKg, hours: infant ? 5 : 2.5, fluid: 'Lactato de Ringer (o SS 0,9 %)' }
  ];
}

/** Método hospitalario: déficit + mantenimiento en 24 h (50 % del déficit en 8 h) */
export function deficitReplacement(weightKg: number, pct: number, maintDailyMl: number) {
  const deficit = weightKg * pct * 10;
  const first8 = deficit / 2 + maintDailyMl / 3;
  const next16 = deficit / 2 + (maintDailyMl * 2) / 3;
  return {
    deficit, total: deficit + maintDailyMl,
    first8: { volumeMl: first8, mlPerHour: first8 / 8 },
    next16: { volumeMl: next16, mlPerHour: next16 / 16 }
  };
}
