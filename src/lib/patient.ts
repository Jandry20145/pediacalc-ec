export type Sex = 'M' | 'F';

export interface Patient {
  weightKg: number | null;
  heightCm: number | null;
  sex: Sex;
  /** ISO yyyy-mm-dd; si existe tiene prioridad sobre ageMonths */
  dob: string | null;
  ageMonths: number | null;
  measureDate: string; // fecha de la medición (ISO)
}

export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function emptyPatient(): Patient {
  return { weightKg: null, heightCm: null, sex: 'M', dob: null, ageMonths: null, measureDate: todayISO() };
}

/** Edad en días entre dos fechas ISO */
export function ageDays(dob: string, at: string): number {
  const a = Date.parse(dob + 'T00:00:00');
  const b = Date.parse(at + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

/** Edad en meses decimales (convención OMS: días / 30.4375) */
export function resolveAgeMonths(p: Patient): number | null {
  if (p.dob) {
    const d = ageDays(p.dob, p.measureDate || todayISO());
    return d >= 0 ? d / 30.4375 : null;
  }
  return p.ageMonths;
}

export function formatAge(months: number | null): string {
  if (months == null || !isFinite(months)) return '—';
  const days = Math.round(months * 30.4375);
  if (days < 31) return `${days} día${days === 1 ? '' : 's'}`;
  if (months < 24) return `${Math.floor(months)} m ${Math.floor((months % 1) * 30.4)} d`;
  const y = Math.floor(months / 12);
  const m = Math.floor(months % 12);
  return `${y} a ${m} m`;
}

export function ageCategory(months: number | null): string {
  if (months == null) return 'Edad no registrada';
  if (months < 1) return 'Neonato';
  if (months < 12) return 'Lactante menor';
  if (months < 24) return 'Lactante mayor';
  if (months < 60) return 'Preescolar';
  if (months < 144) return 'Escolar';
  return 'Adolescente';
}

/** Superficie corporal (m²). Mosteller si hay talla; si no, fórmula (4P+7)/(P+90) */
export function bsa(weightKg: number, heightCm?: number | null): number {
  if (heightCm && heightCm > 0) return Math.sqrt((weightKg * heightCm) / 3600);
  return (4 * weightKg + 7) / (weightKg + 90);
}

export function validateWeight(w: number | null): string | null {
  if (w == null) return null;
  if (w < 0.4 || w > 150) return 'Peso fuera de rango (0,4–150 kg)';
  return null;
}

/** Peso estimado por edad (APLS) para emergencias cuando no se puede pesar */
export function estimatedWeight(months: number): number {
  if (months < 12) return (months / 2) + 4;
  const y = months / 12;
  if (y <= 5) return 2 * y + 8;
  if (y <= 12) return 3 * y + 7;
  return NaN;
}

// ---------- Store con persistencia local ----------
type Listener = (p: Patient) => void;
const KEY = 'pediacalc.patient.v1';
let state: Patient = load();
const listeners = new Set<Listener>();

function load(): Patient {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyPatient(), ...JSON.parse(raw), measureDate: todayISO() };
  } catch { /* sin almacenamiento */ }
  return emptyPatient();
}

export const patientStore = {
  get: (): Patient => state,
  set(patch: Partial<Patient>) {
    state = { ...state, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
    listeners.forEach((l) => l(state));
  },
  reset() { this.set(emptyPatient()); },
  subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l); }
};
