// Vademécum pediátrico de referencia. Dosis tomadas de AIEPI-MSP Ecuador, CNMB,
// Harriet Lane y BNF for Children. Verificar siempre con la normativa vigente.

export type DoseMode = 'perDay' | 'perDose' | 'bandWeight' | 'bandAge';

export interface Presentation {
  label: string;
  /** cantidad de fármaco (en la unidad del fármaco) por ml, o por tableta si form = 'tab' */
  conc: number;
  form: 'ml' | 'tab';
}

export interface Band { upTo: number; dose: number; note?: string }

export interface Drug {
  id: string;
  name: string;
  group: DrugGroup;
  route: string;
  unit: 'mg' | 'UI' | 'mcg';
  mode: DoseMode;
  /** mg/kg/día (perDay) o mg/kg/dosis (perDose) */
  doseMin?: number;
  doseMax?: number;
  doseDefault?: number;
  /** horas entre dosis */
  intervalH: number;
  maxPerDose?: number;
  maxPerDay?: number;
  minPerDose?: number;
  /** límites de peso (kg) o edad (meses) para mode band* */
  bands?: Band[];
  presentations: Presentation[];
  duration?: string;
  minAgeMonths?: number;
  notes?: string;
  emergency?: boolean;
}

export type DrugGroup =
  | 'Antipiréticos / analgésicos'
  | 'Antibióticos'
  | 'Antivirales / antiparasitarios'
  | 'Respiratorio'
  | 'Gastrointestinal'
  | 'Micronutrientes'
  | 'Emergencia';

export const DRUGS: Drug[] = [
  // ----- Antipiréticos -----
  {
    id: 'paracetamol', name: 'Paracetamol', group: 'Antipiréticos / analgésicos', route: 'VO', unit: 'mg',
    mode: 'perDose', doseMin: 10, doseMax: 15, doseDefault: 15, intervalH: 6, maxPerDose: 1000, maxPerDay: 4000,
    presentations: [
      { label: 'Jarabe 120 mg/5 ml', conc: 24, form: 'ml' },
      { label: 'Jarabe 160 mg/5 ml', conc: 32, form: 'ml' },
      { label: 'Gotas 100 mg/ml', conc: 100, form: 'ml' },
      { label: 'Tableta 500 mg', conc: 500, form: 'tab' }
    ],
    notes: 'Máximo 75 mg/kg/día (60 mg/kg/día en lactantes < 3 m). No exceder 5 dosis en 24 h.'
  },
  {
    id: 'paracetamol-iv', name: 'Paracetamol IV', group: 'Antipiréticos / analgésicos', route: 'IV (15 min)', unit: 'mg',
    mode: 'perDose', doseMin: 7.5, doseMax: 15, doseDefault: 15, intervalH: 6, maxPerDose: 1000, maxPerDay: 4000,
    presentations: [{ label: 'Solución 10 mg/ml', conc: 10, form: 'ml' }],
    notes: '< 10 kg: 7,5–10 mg/kg/dosis (máx. 30 mg/kg/día). Neonatos: consultar dosis específica.'
  },
  {
    id: 'ibuprofeno', name: 'Ibuprofeno', group: 'Antipiréticos / analgésicos', route: 'VO', unit: 'mg',
    mode: 'perDose', doseMin: 5, doseMax: 10, doseDefault: 10, intervalH: 8, maxPerDose: 400, maxPerDay: 1200,
    minAgeMonths: 6,
    presentations: [
      { label: 'Suspensión 100 mg/5 ml', conc: 20, form: 'ml' },
      { label: 'Suspensión 200 mg/5 ml', conc: 40, form: 'ml' },
      { label: 'Tableta 400 mg', conc: 400, form: 'tab' }
    ],
    notes: 'Máx. 40 mg/kg/día. Evitar en deshidratación, dengue (sospecha), varicela y enfermedad renal.'
  },
  {
    id: 'metamizol', name: 'Metamizol (dipirona)', group: 'Antipiréticos / analgésicos', route: 'VO / IV lenta / IM', unit: 'mg',
    mode: 'perDose', doseMin: 10, doseMax: 15, doseDefault: 15, intervalH: 6, maxPerDose: 1000, maxPerDay: 4000,
    minAgeMonths: 3,
    presentations: [
      { label: 'Jarabe 250 mg/5 ml', conc: 50, form: 'ml' },
      { label: 'Ampolla 1 g/2 ml', conc: 500, form: 'ml' }
    ],
    notes: 'No recomendado en < 3 meses o < 5 kg. IV lento (riesgo de hipotensión). Vigilar agranulocitosis.'
  },

  // ----- Antibióticos -----
  {
    id: 'amoxicilina', name: 'Amoxicilina', group: 'Antibióticos', route: 'VO', unit: 'mg',
    mode: 'perDay', doseMin: 50, doseMax: 90, doseDefault: 90, intervalH: 12, maxPerDay: 4000,
    presentations: [
      { label: 'Suspensión 250 mg/5 ml', conc: 50, form: 'ml' },
      { label: 'Suspensión 500 mg/5 ml', conc: 100, form: 'ml' },
      { label: 'Cápsula 500 mg', conc: 500, form: 'tab' }
    ],
    duration: 'Neumonía: 5 días · OMA: 7–10 días · Faringoamigdalitis: 10 días',
    notes: 'AIEPI-MSP neumonía: 90 mg/kg/día c/12 h. Faringitis estreptocócica: 50 mg/kg/día.'
  },
  {
    id: 'amoxiclav', name: 'Amoxicilina + ác. clavulánico', group: 'Antibióticos', route: 'VO', unit: 'mg',
    mode: 'perDay', doseMin: 45, doseMax: 90, doseDefault: 90, intervalH: 12, maxPerDay: 4000,
    presentations: [
      { label: 'Susp. 400/57 mg/5 ml', conc: 80, form: 'ml' },
      { label: 'Susp. 250/62,5 mg/5 ml', conc: 50, form: 'ml' },
      { label: 'Tableta 875/125 mg', conc: 875, form: 'tab' }
    ],
    duration: '7–10 días',
    notes: 'Dosis expresada en amoxicilina. Usar formulación 7:1 (400/57) para dosis altas c/12 h (menos diarrea).'
  },
  {
    id: 'azitromicina', name: 'Azitromicina', group: 'Antibióticos', route: 'VO', unit: 'mg',
    mode: 'perDay', doseMin: 10, doseMax: 10, doseDefault: 10, intervalH: 24, maxPerDay: 500,
    presentations: [
      { label: 'Suspensión 200 mg/5 ml', conc: 40, form: 'ml' },
      { label: 'Tableta 500 mg', conc: 500, form: 'tab' }
    ],
    duration: '3 días (o 10 mg/kg día 1 y 5 mg/kg días 2–5)',
    notes: 'Tos ferina: 10 mg/kg/día × 5 días (< 6 m). Cólera/diarrea con sangre según AIEPI.'
  },
  {
    id: 'claritromicina', name: 'Claritromicina', group: 'Antibióticos', route: 'VO', unit: 'mg',
    mode: 'perDay', doseMin: 15, doseMax: 15, doseDefault: 15, intervalH: 12, maxPerDay: 1000,
    presentations: [
      { label: 'Suspensión 125 mg/5 ml', conc: 25, form: 'ml' },
      { label: 'Suspensión 250 mg/5 ml', conc: 50, form: 'ml' }
    ],
    duration: '7–10 días'
  },
  {
    id: 'cefalexina', name: 'Cefalexina', group: 'Antibióticos', route: 'VO', unit: 'mg',
    mode: 'perDay', doseMin: 25, doseMax: 100, doseDefault: 50, intervalH: 6, maxPerDay: 4000,
    presentations: [
      { label: 'Suspensión 250 mg/5 ml', conc: 50, form: 'ml' },
      { label: 'Cápsula 500 mg', conc: 500, form: 'tab' }
    ],
    duration: 'Piel/partes blandas: 7–10 días',
    notes: 'Infecciones leves 25–50 mg/kg/día; graves hasta 100 mg/kg/día.'
  },
  {
    id: 'cotrimoxazol', name: 'Cotrimoxazol (TMP-SMX)', group: 'Antibióticos', route: 'VO', unit: 'mg',
    mode: 'perDay', doseMin: 6, doseMax: 12, doseDefault: 8, intervalH: 12, maxPerDay: 320,
    minAgeMonths: 2,
    presentations: [
      { label: 'Susp. 200/40 mg/5 ml (TMP 8 mg/ml)', conc: 8, form: 'ml' },
      { label: 'Tableta 800/160 mg', conc: 160, form: 'tab' }
    ],
    duration: 'ITU: 7–10 días',
    notes: 'Dosis expresada en trimetoprim (TMP). Contraindicado en < 2 meses.'
  },
  {
    id: 'ceftriaxona', name: 'Ceftriaxona', group: 'Antibióticos', route: 'IV / IM', unit: 'mg',
    mode: 'perDay', doseMin: 50, doseMax: 100, doseDefault: 100, intervalH: 24, maxPerDay: 4000, maxPerDose: 2000,
    presentations: [
      { label: 'Vial 1 g reconstituido en 10 ml (100 mg/ml)', conc: 100, form: 'ml' },
      { label: 'Vial 1 g en 3,5 ml lidocaína (IM)', conc: 285.7, form: 'ml' }
    ],
    notes: 'Meningitis: 100 mg/kg/día c/12–24 h. Evitar en neonatos con hiperbilirrubinemia y NO administrar con calcio IV.'
  },
  {
    id: 'ampicilina', name: 'Ampicilina', group: 'Antibióticos', route: 'IV', unit: 'mg',
    mode: 'perDay', doseMin: 100, doseMax: 200, doseDefault: 200, intervalH: 6, maxPerDay: 12000,
    presentations: [{ label: 'Vial 1 g en 10 ml (100 mg/ml)', conc: 100, form: 'ml' }],
    notes: 'Neumonía grave (AIEPI): 200 mg/kg/día + gentamicina. Meningitis: 300–400 mg/kg/día.'
  },
  {
    id: 'gentamicina', name: 'Gentamicina', group: 'Antibióticos', route: 'IV / IM', unit: 'mg',
    mode: 'perDay', doseMin: 5, doseMax: 7.5, doseDefault: 7.5, intervalH: 24,
    presentations: [
      { label: 'Ampolla 80 mg/2 ml', conc: 40, form: 'ml' },
      { label: 'Ampolla 20 mg/2 ml', conc: 10, form: 'ml' }
    ],
    notes: 'Neonatos: 4–5 mg/kg/dosis con intervalo según edad gestacional. Ajustar en falla renal; nefro/ototóxico.'
  },
  {
    id: 'oxacilina', name: 'Oxacilina', group: 'Antibióticos', route: 'IV', unit: 'mg',
    mode: 'perDay', doseMin: 100, doseMax: 200, doseDefault: 150, intervalH: 6, maxPerDay: 12000,
    presentations: [{ label: 'Vial 1 g en 10 ml (100 mg/ml)', conc: 100, form: 'ml' }],
    notes: 'Infecciones estafilocócicas. Celulitis/osteomielitis.'
  },
  {
    id: 'clindamicina', name: 'Clindamicina', group: 'Antibióticos', route: 'IV', unit: 'mg',
    mode: 'perDay', doseMin: 20, doseMax: 40, doseDefault: 30, intervalH: 8, maxPerDay: 2700,
    presentations: [{ label: 'Ampolla 600 mg/4 ml (150 mg/ml)', conc: 150, form: 'ml' }],
    notes: 'Diluir a ≤ 18 mg/ml e infundir en ≥ 10–60 min.'
  },
  {
    id: 'penicilina-cristalina', name: 'Penicilina G cristalina', group: 'Antibióticos', route: 'IV', unit: 'UI',
    mode: 'perDay', doseMin: 100000, doseMax: 300000, doseDefault: 200000, intervalH: 4, maxPerDay: 24000000,
    presentations: [{ label: 'Vial 1.000.000 UI en 10 ml', conc: 100000, form: 'ml' }],
    notes: 'Meningitis/neumonía grave: 250.000–400.000 UI/kg/día c/4–6 h.'
  },
  {
    id: 'penicilina-benzatinica', name: 'Penicilina G benzatínica', group: 'Antibióticos', route: 'IM profunda', unit: 'UI',
    mode: 'bandWeight', intervalH: 0,
    bands: [{ upTo: 27, dose: 600000 }, { upTo: 999, dose: 1200000 }],
    presentations: [{ label: 'Vial 1.200.000 UI en 4 ml', conc: 300000, form: 'ml' }],
    duration: 'Dosis única (faringoamigdalitis estreptocócica)',
    notes: '< 27 kg: 600.000 UI; ≥ 27 kg: 1.200.000 UI. Tener adrenalina disponible.'
  },

  // ----- Antivirales / antiparasitarios -----
  {
    id: 'oseltamivir', name: 'Oseltamivir', group: 'Antivirales / antiparasitarios', route: 'VO', unit: 'mg',
    mode: 'bandWeight', intervalH: 12,
    bands: [{ upTo: 15, dose: 30 }, { upTo: 23, dose: 45 }, { upTo: 40, dose: 60 }, { upTo: 999, dose: 75 }],
    presentations: [{ label: 'Suspensión 6 mg/ml', conc: 6, form: 'ml' }, { label: 'Cápsula 75 mg', conc: 75, form: 'tab' }],
    duration: '5 días',
    notes: 'Para ≥ 12 meses. Lactantes < 12 m: 3 mg/kg/dosis c/12 h.'
  },
  {
    id: 'albendazol', name: 'Albendazol', group: 'Antivirales / antiparasitarios', route: 'VO', unit: 'mg',
    mode: 'bandAge', intervalH: 0, minAgeMonths: 12,
    bands: [{ upTo: 24, dose: 200, note: '12–23 meses' }, { upTo: 9999, dose: 400, note: '≥ 2 años' }],
    presentations: [{ label: 'Suspensión 400 mg/20 ml (20 mg/ml)', conc: 20, form: 'ml' }, { label: 'Tableta 400 mg', conc: 400, form: 'tab' }],
    duration: 'Dosis única (desparasitación MSP cada 6 meses)'
  },
  {
    id: 'nitazoxanida', name: 'Nitazoxanida', group: 'Antivirales / antiparasitarios', route: 'VO', unit: 'mg',
    mode: 'bandAge', intervalH: 12, minAgeMonths: 12,
    bands: [{ upTo: 48, dose: 100, note: '1–3 años' }, { upTo: 144, dose: 200, note: '4–11 años' }, { upTo: 9999, dose: 500, note: '≥ 12 años' }],
    presentations: [{ label: 'Suspensión 100 mg/5 ml', conc: 20, form: 'ml' }, { label: 'Tableta 500 mg', conc: 500, form: 'tab' }],
    duration: '3 días'
  },
  {
    id: 'metronidazol', name: 'Metronidazol', group: 'Antivirales / antiparasitarios', route: 'VO', unit: 'mg',
    mode: 'perDay', doseMin: 15, doseMax: 50, doseDefault: 30, intervalH: 8, maxPerDay: 2250,
    presentations: [{ label: 'Suspensión 125 mg/5 ml', conc: 25, form: 'ml' }, { label: 'Suspensión 250 mg/5 ml', conc: 50, form: 'ml' }],
    duration: 'Giardiasis: 15 mg/kg/día × 5–7 d · Amebiasis: 30–50 mg/kg/día × 7–10 d'
  },

  // ----- Respiratorio -----
  {
    id: 'salbutamol-neb', name: 'Salbutamol nebulizado', group: 'Respiratorio', route: 'Nebulización', unit: 'mg',
    mode: 'perDose', doseMin: 0.15, doseMax: 0.15, doseDefault: 0.15, intervalH: 0, minPerDose: 2.5, maxPerDose: 5,
    presentations: [{ label: 'Solución 5 mg/ml', conc: 5, form: 'ml' }],
    notes: 'Crisis: c/20 min × 3 dosis. Diluir en SS 0,9 % hasta 3–4 ml. Preferir inhalador 100 mcg con cámara: 2–4 puff (< 20 kg) / 4–8 puff.'
  },
  {
    id: 'prednisolona', name: 'Prednisolona', group: 'Respiratorio', route: 'VO', unit: 'mg',
    mode: 'perDay', doseMin: 1, doseMax: 2, doseDefault: 1, intervalH: 24, maxPerDay: 40,
    presentations: [{ label: 'Solución 15 mg/5 ml', conc: 3, form: 'ml' }, { label: 'Tableta prednisona 20 mg', conc: 20, form: 'tab' }],
    duration: 'Crisis asmática: 3–5 días'
  },
  {
    id: 'dexametasona', name: 'Dexametasona', group: 'Respiratorio', route: 'VO / IM / IV', unit: 'mg',
    mode: 'perDose', doseMin: 0.15, doseMax: 0.6, doseDefault: 0.6, intervalH: 0, maxPerDose: 16,
    presentations: [{ label: 'Ampolla 4 mg/ml', conc: 4, form: 'ml' }],
    duration: 'Laringotraqueítis (crup): dosis única',
    notes: 'Crup leve 0,15 mg/kg; moderado-grave 0,6 mg/kg.'
  },
  {
    id: 'adrenalina-neb', name: 'Adrenalina nebulizada (1 mg/ml)', group: 'Respiratorio', route: 'Nebulización', unit: 'mg',
    mode: 'perDose', doseMin: 0.5, doseMax: 0.5, doseDefault: 0.5, intervalH: 0, maxPerDose: 5,
    presentations: [{ label: 'Ampolla 1 mg/ml (1:1000)', conc: 1, form: 'ml' }],
    notes: 'Crup moderado-grave: 0,5 ml/kg (máx. 5 ml). Observar 3–4 h por efecto rebote.'
  },
  {
    id: 'loratadina', name: 'Loratadina', group: 'Respiratorio', route: 'VO', unit: 'mg',
    mode: 'bandWeight', intervalH: 24, minAgeMonths: 24,
    bands: [{ upTo: 30, dose: 5 }, { upTo: 999, dose: 10 }],
    presentations: [{ label: 'Jarabe 5 mg/5 ml', conc: 1, form: 'ml' }, { label: 'Tableta 10 mg', conc: 10, form: 'tab' }]
  },

  // ----- Gastrointestinal -----
  {
    id: 'ondansetron', name: 'Ondansetrón', group: 'Gastrointestinal', route: 'VO / IV', unit: 'mg',
    mode: 'perDose', doseMin: 0.15, doseMax: 0.15, doseDefault: 0.15, intervalH: 8, maxPerDose: 4,
    minAgeMonths: 6,
    presentations: [{ label: 'Ampolla 8 mg/4 ml (2 mg/ml)', conc: 2, form: 'ml' }, { label: 'Tableta 4 mg', conc: 4, form: 'tab' }],
    notes: 'Gastroenteritis con vómito para facilitar la rehidratación oral. Riesgo de QT prolongado.'
  },
  {
    id: 'zinc', name: 'Zinc (sulfato)', group: 'Gastrointestinal', route: 'VO', unit: 'mg',
    mode: 'bandAge', intervalH: 24,
    bands: [{ upTo: 6, dose: 10, note: '< 6 meses' }, { upTo: 9999, dose: 20, note: '≥ 6 meses' }],
    presentations: [{ label: 'Jarabe 20 mg/5 ml', conc: 4, form: 'ml' }, { label: 'Tableta dispersable 20 mg', conc: 20, form: 'tab' }],
    duration: '10–14 días (toda diarrea, AIEPI)'
  },
  {
    id: 'omeprazol', name: 'Omeprazol', group: 'Gastrointestinal', route: 'VO / IV', unit: 'mg',
    mode: 'perDay', doseMin: 1, doseMax: 1, doseDefault: 1, intervalH: 24, maxPerDay: 40,
    presentations: [{ label: 'Vial 40 mg/10 ml', conc: 4, form: 'ml' }, { label: 'Cápsula 20 mg', conc: 20, form: 'tab' }]
  },

  // ----- Micronutrientes -----
  {
    id: 'hierro', name: 'Hierro elemental (sulfato ferroso)', group: 'Micronutrientes', route: 'VO', unit: 'mg',
    mode: 'perDay', doseMin: 1, doseMax: 6, doseDefault: 3, intervalH: 24, maxPerDay: 200,
    presentations: [{ label: 'Gotas 125 mg/ml (25 mg Fe/ml)', conc: 25, form: 'ml' }, { label: 'Jarabe 15 mg Fe/5 ml', conc: 3, form: 'ml' }],
    duration: 'Profilaxis 1–2 mg/kg/día · Tratamiento anemia 3–6 mg/kg/día × 3 meses',
    notes: 'Administrar lejos de lácteos, con jugo cítrico.'
  },
  {
    id: 'vitamina-a', name: 'Vitamina A', group: 'Micronutrientes', route: 'VO', unit: 'UI',
    mode: 'bandAge', intervalH: 0, minAgeMonths: 6,
    bands: [{ upTo: 12, dose: 100000, note: '6–11 meses' }, { upTo: 60, dose: 200000, note: '12–59 meses' }],
    presentations: [{ label: 'Cápsula 100.000 UI', conc: 100000, form: 'tab' }, { label: 'Cápsula 200.000 UI', conc: 200000, form: 'tab' }],
    duration: 'Suplementación MSP cada 6 meses; sarampión: días 1 y 2'
  },

  // ----- Emergencia -----
  {
    id: 'adrenalina-pcr', name: 'Adrenalina (PCR)', group: 'Emergencia', route: 'IV / IO', unit: 'mg', emergency: true,
    mode: 'perDose', doseMin: 0.01, doseMax: 0.01, doseDefault: 0.01, intervalH: 0, maxPerDose: 1,
    presentations: [{ label: 'Diluida 0,1 mg/ml (1:10.000)', conc: 0.1, form: 'ml' }],
    notes: '0,1 ml/kg de 1:10.000 cada 3–5 min. Diluir 1 ampolla (1 mg/ml) en 9 ml SS.'
  },
  {
    id: 'adrenalina-im', name: 'Adrenalina (anafilaxia)', group: 'Emergencia', route: 'IM (muslo)', unit: 'mg', emergency: true,
    mode: 'perDose', doseMin: 0.01, doseMax: 0.01, doseDefault: 0.01, intervalH: 0, maxPerDose: 0.5,
    presentations: [{ label: 'Ampolla 1 mg/ml (1:1000)', conc: 1, form: 'ml' }],
    notes: 'Repetir c/5–15 min si no hay respuesta.'
  },
  {
    id: 'atropina', name: 'Atropina', group: 'Emergencia', route: 'IV / IO', unit: 'mg', emergency: true,
    mode: 'perDose', doseMin: 0.02, doseMax: 0.02, doseDefault: 0.02, intervalH: 0, minPerDose: 0.1, maxPerDose: 0.5,
    presentations: [{ label: 'Ampolla 1 mg/ml', conc: 1, form: 'ml' }]
  },
  {
    id: 'midazolam', name: 'Midazolam (convulsión)', group: 'Emergencia', route: 'IV / IN / IM / bucal', unit: 'mg', emergency: true,
    mode: 'perDose', doseMin: 0.1, doseMax: 0.2, doseDefault: 0.2, intervalH: 0, maxPerDose: 10,
    presentations: [{ label: 'Ampolla 5 mg/ml', conc: 5, form: 'ml' }, { label: 'Ampolla 15 mg/3 ml', conc: 5, form: 'ml' }],
    notes: 'IV 0,1–0,2 mg/kg; IN/IM 0,2 mg/kg (máx. 10 mg). Puede repetirse 1 vez a los 5 min.'
  },
  {
    id: 'diazepam', name: 'Diazepam (convulsión)', group: 'Emergencia', route: 'IV / rectal', unit: 'mg', emergency: true,
    mode: 'perDose', doseMin: 0.2, doseMax: 0.5, doseDefault: 0.3, intervalH: 0, maxPerDose: 10,
    presentations: [{ label: 'Ampolla 10 mg/2 ml', conc: 5, form: 'ml' }],
    notes: 'IV 0,2–0,3 mg/kg; rectal 0,5 mg/kg. Vigilar depresión respiratoria.'
  },
  {
    id: 'fenitoina', name: 'Fenitoína (impregnación)', group: 'Emergencia', route: 'IV (SS 0,9 %)', unit: 'mg', emergency: true,
    mode: 'perDose', doseMin: 15, doseMax: 20, doseDefault: 20, intervalH: 0, maxPerDose: 1500,
    presentations: [{ label: 'Ampolla 250 mg/5 ml', conc: 50, form: 'ml' }],
    notes: 'Infundir ≤ 1 mg/kg/min (máx. 50 mg/min) con monitor. Solo en SS 0,9 %.'
  },
  {
    id: 'dextrosa10', name: 'Dextrosa 10 % (hipoglucemia)', group: 'Emergencia', route: 'IV', unit: 'mg', emergency: true,
    mode: 'perDose', doseMin: 200, doseMax: 500, doseDefault: 200, intervalH: 0, maxPerDose: 25000,
    presentations: [{ label: 'Dextrosa 10 % (100 mg/ml)', conc: 100, form: 'ml' }],
    notes: '2–5 ml/kg de D10 %. Neonatos: 2 ml/kg. Control de glucemia a los 15–30 min.'
  },
  {
    id: 'furosemida', name: 'Furosemida', group: 'Emergencia', route: 'IV', unit: 'mg',
    mode: 'perDose', doseMin: 0.5, doseMax: 2, doseDefault: 1, intervalH: 12, maxPerDose: 40,
    presentations: [{ label: 'Ampolla 20 mg/2 ml', conc: 10, form: 'ml' }]
  },
  {
    id: 'difenhidramina', name: 'Difenhidramina', group: 'Emergencia', route: 'IV / IM / VO', unit: 'mg',
    mode: 'perDose', doseMin: 1, doseMax: 1.25, doseDefault: 1, intervalH: 6, maxPerDose: 50,
    minAgeMonths: 24,
    presentations: [{ label: 'Ampolla 50 mg/ml', conc: 50, form: 'ml' }, { label: 'Jarabe 12,5 mg/5 ml', conc: 2.5, form: 'ml' }]
  },
  {
    id: 'hidrocortisona', name: 'Hidrocortisona', group: 'Emergencia', route: 'IV', unit: 'mg',
    mode: 'perDose', doseMin: 4, doseMax: 5, doseDefault: 5, intervalH: 6, maxPerDose: 100,
    presentations: [{ label: 'Vial 100 mg/2 ml', conc: 50, form: 'ml' }, { label: 'Vial 500 mg/4 ml', conc: 125, form: 'ml' }],
    notes: 'Crisis asmática / anafilaxia. Insuficiencia suprarrenal: 50–100 mg/m².'
  }
];

export const GROUPS: DrugGroup[] = [
  'Antipiréticos / analgésicos', 'Antibióticos', 'Antivirales / antiparasitarios',
  'Respiratorio', 'Gastrointestinal', 'Micronutrientes', 'Emergencia'
];
