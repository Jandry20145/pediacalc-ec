import type { Drug, Presentation } from '../data/drugs';

export interface DoseResult {
  perDose: number;        // unidades del fármaco por toma
  perDay: number | null;  // total diario
  dosesPerDay: number | null;
  capped: 'none' | 'maxDose' | 'maxDay' | 'minDose';
  bandNote?: string;
  warnings: string[];
  volumes: { p: Presentation; amount: number; text: string }[];
}

export function dosesPerDay(d: Drug): number | null {
  return d.intervalH > 0 ? 24 / d.intervalH : null;
}

export function formatAmount(n: number, unit: string): string {
  if (unit === 'UI') return `${Math.round(n).toLocaleString('es-EC')} UI`;
  const v = n >= 100 ? Math.round(n) : n >= 10 ? Math.round(n * 10) / 10 : Math.round(n * 100) / 100;
  return `${v.toLocaleString('es-EC')} ${unit}`;
}

/** Redondeo práctico del volumen: 0,1 ml (< 10 ml) o 0,5 ml */
function roundVolume(ml: number): number {
  if (ml < 1) return Math.round(ml * 100) / 100;
  if (ml < 10) return Math.round(ml * 10) / 10;
  return Math.round(ml * 2) / 2;
}

function roundTabs(t: number): number {
  return Math.round(t * 4) / 4; // cuartos de tableta
}

/**
 * @param dose mg/kg/día o mg/kg/dosis seleccionado (para modos por kg)
 */
export function computeDose(d: Drug, weightKg: number, ageMonths: number | null, dose?: number): DoseResult {
  const warnings: string[] = [];
  const n = dosesPerDay(d);
  let perDose: number, perDay: number | null = null;
  let capped: DoseResult['capped'] = 'none';
  let bandNote: string | undefined;

  if (d.minAgeMonths != null && ageMonths != null && ageMonths < d.minAgeMonths) {
    warnings.push(`No recomendado en menores de ${d.minAgeMonths >= 12 ? d.minAgeMonths / 12 + ' año(s)' : d.minAgeMonths + ' meses'}.`);
  }

  if (d.mode === 'bandWeight' || d.mode === 'bandAge') {
    const key = d.mode === 'bandWeight' ? weightKg : ageMonths;
    if (key == null) {
      warnings.push('Se requiere la edad del paciente para esta dosis.');
      perDose = NaN;
    } else {
      const band = d.bands!.find((b) => key < b.upTo) ?? d.bands![d.bands!.length - 1];
      perDose = band.dose;
      bandNote = band.note;
      if (d.mode === 'bandAge' && d.bands && key >= d.bands[d.bands.length - 1].upTo) warnings.push('Edad fuera del rango de la pauta.');
    }
    perDay = n ? perDose * n : null;
  } else {
    const sel = dose ?? d.doseDefault ?? d.doseMin!;
    if (d.mode === 'perDay') {
      perDay = sel * weightKg;
      if (d.maxPerDay && perDay > d.maxPerDay) { perDay = d.maxPerDay; capped = 'maxDay'; }
      perDose = perDay / (n ?? 1);
    } else {
      perDose = sel * weightKg;
      perDay = n ? perDose * n : null;
    }
    if (d.maxPerDose && perDose > d.maxPerDose) {
      perDose = d.maxPerDose; capped = 'maxDose';
      if (n) perDay = perDose * n;
    }
    if (d.maxPerDay && perDay && perDay > d.maxPerDay) {
      perDay = d.maxPerDay; perDose = perDay / (n ?? 1); capped = 'maxDay';
    }
    if (d.minPerDose && perDose < d.minPerDose) { perDose = d.minPerDose; capped = 'minDose'; }
  }

  const volumes = d.presentations.map((p) => {
    const amount = perDose / p.conc;
    let text: string;
    if (!isFinite(amount)) text = '—';
    else if (p.form === 'ml') text = `${roundVolume(amount).toLocaleString('es-EC')} ml`;
    else {
      const t = roundTabs(amount);
      text = t < 0.25 ? 'Usar forma líquida' : `${t.toLocaleString('es-EC')} tableta${t === 1 ? '' : 's'}`;
    }
    return { p, amount, text };
  });

  return { perDose, perDay, dosesPerDay: n, capped, bandNote, warnings, volumes };
}

export function intervalLabel(d: Drug): string {
  if (d.intervalH === 0) return d.mode.startsWith('band') && !d.duration?.includes('única') ? 'Según pauta' : 'Dosis única / PRN';
  return `c/${d.intervalH} h`;
}
