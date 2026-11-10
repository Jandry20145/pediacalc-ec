import { describe, it, expect } from 'vitest';
import { hollidaySegar, drip, planB, planC, classifyDehydration, gir } from '../src/lib/fluids';
import { bsa } from '../src/lib/patient';
import { assess, lmsAt, zScore, table } from '../src/lib/growth';
import { computeDose } from '../src/lib/dosing';
import { DRUGS } from '../src/data/drugs';
import { computeNP, npDefaults } from '../src/lib/parenteral';

const drug = (id: string) => DRUGS.find((d) => d.id === id)!;

describe('Líquidos', () => {
  it('Holliday-Segar', () => {
    expect(hollidaySegar(8)).toBe(800);
    expect(hollidaySegar(15)).toBe(1250);
    expect(hollidaySegar(30)).toBe(1700);
  });
  it('Goteo: 500 ml en 8 h macrogotero ≈ 20.8 gtt/min', () => {
    const r = drip(500, 8, 20);
    expect(r.mlPerHour).toBeCloseTo(62.5);
    expect(r.dropsPerMin).toBeCloseTo(20.83, 1);
  });
  it('VIG: D10 % a 4 ml/h en 1 kg ≈ 6.7 mg/kg/min', () => {
    expect(gir(10, 4, 1)).toBeCloseTo(6.67, 1);
  });
  it('Superficie corporal Mosteller', () => {
    expect(bsa(20, 110)).toBeCloseTo(0.782, 2);
  });
});

describe('Deshidratación AIEPI', () => {
  it('Plan B = 75 ml/kg', () => expect(planB(10)[0].volumeMl).toBe(750));
  it('Plan C lactante: 30 ml/kg en 1 h, 70 ml/kg en 5 h', () => {
    const s = planC(8, 6);
    expect(s[0]).toMatchObject({ volumeMl: 240, hours: 1 });
    expect(s[1]).toMatchObject({ volumeMl: 560, hours: 5 });
  });
  it('Plan C ≥ 12 m: 30 min y 2.5 h', () => {
    const s = planC(12, 24);
    expect(s[0].hours).toBe(0.5);
    expect(s[1].hours).toBe(2.5);
  });
  it('Clasificación', () => {
    expect(classifyDehydration(new Set())).toBe('none');
    expect(classifyDehydration(new Set(['intranquilo', 'bebeAvido']))).toBe('some');
    expect(classifyDehydration(new Set(['letargico', 'nobebe']))).toBe('severe');
  });
});

describe('Curvas OMS', () => {
  it('Mediana P/E niño 0 m = 3.3464 kg → Z 0', () => {
    const l = lmsAt(table('wfa', 'M'), 0)!;
    expect(zScore(l[0], l[1], l[2], 3.3464, true)).toBeCloseTo(0, 3);
  });
  it('Talla/Edad niña 24 m, 78 cm → baja talla (Z < −2)', () => {
    const a = assess('lhfa', 'F', 24, 10, 78)!;
    expect(a.z).toBeLessThan(-2);
    expect(a.cls.label).toMatch(/Baja talla/);
  });
  it('IMC/E niño 10 a con IMC 24 → obesidad', () => {
    const h = 140, w = 24 * (h / 100) ** 2;
    const a = assess('bmi', 'M', 120, w, h)!;
    expect(a.cls.label).toBe('Obesidad');
  });
  it('Referencia OMS 2007 hasta 19 años', () => {
    expect(assess('lhfa', 'M', 216, 60, 176)).not.toBeNull();
  });
});

describe('Dosificación', () => {
  it('Paracetamol 15 mg/kg en 10 kg = 150 mg = 6.3 ml de 120/5', () => {
    const r = computeDose(drug('paracetamol'), 10, 24);
    expect(r.perDose).toBe(150);
    expect(r.volumes[0].text).toBe('6,3 ml');
  });
  it('Paracetamol respeta máximo 1 g por dosis', () => {
    expect(computeDose(drug('paracetamol'), 80, 180).perDose).toBe(1000);
  });
  it('Amoxicilina 90 mg/kg/d c/12h en 12 kg = 540 mg/toma', () => {
    const r = computeDose(drug('amoxicilina'), 12, 30);
    expect(r.perDose).toBe(540);
    expect(r.perDay).toBe(1080);
  });
  it('Penicilina benzatínica por peso', () => {
    expect(computeDose(drug('penicilina-benzatinica'), 20, 72).perDose).toBe(600000);
    expect(computeDose(drug('penicilina-benzatinica'), 30, 120).perDose).toBe(1200000);
  });
  it('Albendazol por edad', () => {
    expect(computeDose(drug('albendazol'), 10, 18).perDose).toBe(200);
    expect(computeDose(drug('albendazol'), 14, 36).perDose).toBe(400);
  });
  it('Ibuprofeno alerta en < 6 meses', () => {
    expect(computeDose(drug('ibuprofeno'), 6, 4).warnings.length).toBeGreaterThan(0);
  });
  it('Salbutamol mínimo 2.5 mg', () => {
    expect(computeDose(drug('salbutamol-neb'), 8, 12).perDose).toBe(2.5);
  });
});

describe('Nutrición parenteral', () => {
  it('Glucosa 50 % = VIG × 1.44 × peso × 2', () => {
    const r = computeNP({ weightKg: 10, volumeMlKg: 100, gir: 6, aa: 2, lipids: 2, na: 3, k: 2, ca: 10, p: 0.5, mg: 0.2, zinc: 0,
      traceElements: true, vitamins: true, lipidsSeparate: true, purgeMl: 30, naclMeqMl: 3.4, kclMeqMl: 2, mgMeqMl: 1.62 });
    expect(r.components.find((c) => c.name.startsWith('Dextrosa'))!.ml).toBeCloseTo(172.8);
    expect(r.components.find((c) => c.name.startsWith('Aminoácidos'))!.ml).toBeCloseTo(200);
    expect(r.totalMl).toBe(1000);
    expect(r.prepMl).toBe(1030);
    expect(r.waterMl).toBeGreaterThan(0);
  });
  it('Alerta de volumen insuficiente', () => {
    const d = npDefaults(3, 0);
    const r = computeNP({ ...(d as Required<typeof d>), weightKg: 3, volumeMlKg: 40, purgeMl: 20, traceElements: true, vitamins: true, lipidsSeparate: true, naclMeqMl: 3.4, kclMeqMl: 2, mgMeqMl: 1.62 });
    expect(r.alerts.some((a) => a.level === 'bad')).toBe(true);
  });
});
