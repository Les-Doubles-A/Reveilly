import { describe, it, expect } from 'vitest';
import math, { MATH_THEMES, GENERATORS, isRight } from '../src/modules/math.js';
import figures, { FIGURES, judge } from '../src/modules/figures.js';
import { seeded } from '../src/core/util.js';

describe('Math', () => {
  it('AC-F3-1 : thème « Puissances » seulement', () => {
    const allowed = new Set(MATH_THEMES.find(t => t.id === 'puissances').gens), rng = seeded(7);
    for (let i = 0; i < 50; i++) {
      const q = math.generate({ themes: ['puissances'] }, rng);
      expect(q.theme).toBe('puissances'); expect(allowed.has(q.generator)).toBe(true);
    }
  });
  it('chaque générateur produit une réponse finie que sa propre correction accepte', () => {
    const rng = seeded(3);
    for (const t of MATH_THEMES) for (let i = 0; i < 40; i++) {
      const q = math.generate({ themes: [t.id] }, rng);
      expect(Number.isFinite(q.raw.a)).toBe(true);
      expect(q.check(q.raw.d || String(q.raw.a).replace('.', ',')).status).toBe('ok');
    }
    expect(Object.keys(GENERATORS).length).toBeGreaterThan(40);
  });
  it('AC-F5-1 : 7 × 8', () => {
    const q = { a: 56 };
    expect(isRight(q, '56')).toBe(true);
    expect(isRight(q, '54')).toBe(false);
    expect(isRight(q, 'abc')).toBeNull();
  });
  it('fractions, décimaux, signe moins typographique', () => {
    expect(isRight({ a: 5 / 6 }, '5/6')).toBe(true);
    expect(isRight({ a: 0.5 }, '0,5')).toBe(true);
    expect(isRight({ a: -3 }, '−3')).toBe(true);
  });
  it('mauvaise réponse → méthode affichée', () => {
    const q = math.generate({ themes: ['tables'] }, seeded(1));
    const r = q.check(String(q.raw.a + 1));
    expect(r.status).toBe('ko'); expect(r.feedback).toMatch(/Comment le faire de tête/);
  });
});

describe('Figures de style', () => {
  it('banque complète reprise', () => {
    expect(FIGURES.length).toBe(68);
    expect(figures.themes.map(t => t.label)).toEqual(['Analogie', 'Substitution', 'Atténuation', 'Opposition', 'Construction', 'Sonorités', 'Énonciation']);
  });
  it('AC-F3-2 : thème « Opposition » seulement', () => {
    const rng = seeded(11);
    for (let i = 0; i < 30; i++) expect(figures.generate({ themes: ['O'] }, rng).theme).toBe('O');
  });
  it('QCM : 4 choix distincts dont la bonne réponse', () => {
    const rng = seeded(5);
    for (let i = 0; i < 30; i++) {
      const q = figures.generate({ themes: ['A', 'C'], mode: 'qcm' }, rng);
      expect(new Set(q.choices).size).toBe(4); expect(q.choices).toContain(q.figure);
      expect(q.check(q.figure).status).toBe('ok');
      expect(q.check(q.choices.find(c => c !== q.figure)).status).toBe('ko');
    }
  });
  it('AC-F5-2 : « metaphor » accepté avec remarque', () => {
    const f = FIGURES.find(d => d.n === 'Métaphore');
    expect(judge('metaphor', f).r).toBe('typo');
    const q = { ...figures.generate({ themes: ['A'], mode: 'saisie' }, seeded(2)) };
    expect(q.input).toBe('text');
  });
  it('saisie : vide → retry ; nom complet exigé', () => {
    let q; const rng = seeded(9);
    do q = figures.generate({ themes: ['A'], mode: 'saisie' }, rng); while (q.figure !== 'Métaphore filée');
    expect(q.check('').status).toBe('retry');
    expect(q.check('métaphore').status).toBe('ok'); // accepté comme figure plus générale
    expect(q.check('METAPHORE FILEE').status).toBe('ok');
    expect(q.check('oxymore').status).toBe('ko');
  });
});
