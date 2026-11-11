import { describe, it, expect, beforeEach } from 'vitest';
import custom, { setCustomCategories, normalizeCategory, parseCategories, exportCategories, judgeText } from '../src/modules/custom.js';
import { createStore, newAlarm, validateAlarm } from '../src/core/store.js';
import { createChallenge } from '../src/core/challenge.js';
import { seeded } from '../src/core/util.js';

const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };

const CAPITALES = {
  name: 'Capitales',
  questions: [
    { question: 'Capitale de l’Australie ?', answer: 'Canberra', wrong: ['Sydney', 'Melbourne', 'Perth'], explanation: 'Choisie en 1908.' },
    { question: 'Capitale du Japon ?', answer: 'Tokyo', accepted: ['Tōkyō'] },
    { question: 'Capitale du Canada ?', answer: 'Ottawa' },
    { question: '6 × 7 ?', answer: '42' }
  ]
};

describe('normalisation', () => {
  it('écarte les questions incomplètes et borne les champs', () => {
    const c = normalizeCategory({ name: '  ' + 'x'.repeat(100), questions: [{ question: 'Q', answer: '' }, { q: 'Q2', a: 'R2', wrong: 'a\nb\nR2\na' }, null] });
    expect(c.name).toHaveLength(60);
    expect(c.questions).toEqual([{ question: 'Q2', answer: 'R2', accepted: [], wrong: ['a', 'b'], explanation: '' }]);
    expect(c.id).toMatch(/^c/);
  });
  it('nom vide → « Sans nom »', () => expect(normalizeCategory({}).name).toBe('Sans nom'));
});

describe('import / export JSON', () => {
  it('aller-retour sans perte', () => {
    const cats = [normalizeCategory(CAPITALES)];
    const back = parseCategories(exportCategories(cats));
    expect(back).toEqual(cats.map(({ id, ...c }) => c));
    expect(JSON.parse(exportCategories(cats)).format).toBe('reveilly-categories');
  });
  it('accepte un tableau ou une catégorie seule', () => {
    expect(parseCategories([CAPITALES])).toHaveLength(1);
    expect(parseCategories(CAPITALES)[0].name).toBe('Capitales');
    expect(parseCategories('﻿' + JSON.stringify({ categories: [CAPITALES] }))).toHaveLength(1);
  });
  it('erreurs lisibles', () => {
    expect(() => parseCategories('{oops')).toThrow(/JSON valide/);
    expect(() => parseCategories('{"a":1}')).toThrow(/Aucune catégorie/);
    expect(() => parseCategories('[{"name":"x","questions":[{"question":"q"}]}]')).toThrow(/Aucune question valide/);
  });
});

describe('correction', () => {
  const q = normalizeCategory(CAPITALES).questions;
  it('casse, accents, articles, fautes légères', () => {
    expect(judgeText('canberra', q[0])).toBe('ok');
    expect(judgeText('  CANBERRA ', q[0])).toBe('ok');
    expect(judgeText('Canbera', q[0])).toBe('typo');
    expect(judgeText('Sydney', q[0])).toBe('ko');
    expect(judgeText('Tokyo', q[1])).toBe('ok');
    expect(judgeText('', q[0])).toBe('empty');
    expect(judgeText('la Canberra', q[0])).toBe('ok');
  });
  it('réponses numériques comparées en nombre, sans tolérance de faute', () => {
    expect(judgeText('42,0', q[3])).toBe('ok');
    expect(judgeText('43', q[3])).toBe('ko');
  });
});

describe('module « Mes questions »', () => {
  let cat;
  beforeEach(() => { cat = normalizeCategory(CAPITALES); setCustomCategories([cat]); });

  it('les catégories deviennent des thèmes', () => {
    expect(custom.themes).toEqual([{ id: cat.id, label: 'Capitales', hint: '4 questions' }]);
    expect(custom.defaults.themes).toEqual([cat.id]);
  });
  it('QCM : 4 choix distincts dont la bonne réponse', () => {
    const rng = seeded(4);
    for (let i = 0; i < 30; i++) {
      const g = custom.generate({ themes: [cat.id], mode: 'qcm' }, rng);
      expect(g.input).toBe('choice');
      expect(new Set(g.choices).size).toBe(4);
      expect(g.choices).toContain(g.raw.answer);
      expect(g.check(g.raw.answer).status).toBe('ok');
      expect(g.check(g.choices.find(c => c !== g.raw.answer)).status).toBe('ko');
    }
  });
  it('les pièges de la question passent en priorité', () => {
    let g; const rng = seeded(8);
    do g = custom.generate({ themes: [cat.id] }, rng); while (g.raw.answer !== 'Canberra');
    expect([...g.choices].sort()).toEqual(['Canberra', 'Melbourne', 'Perth', 'Sydney']);
  });
  it('QCM impossible (une seule réponse connue) → saisie libre', () => {
    setCustomCategories([normalizeCategory({ name: 'Solo', questions: [{ question: 'Q', answer: 'R' }] })]);
    const g = custom.generate({ themes: [custom.themes[0].id], mode: 'qcm' }, seeded(1));
    expect(g.input).toBe('text');
  });
  it('saisie : vide → retry, explication affichée', () => {
    let g; const rng = seeded(2);
    do g = custom.generate({ themes: [cat.id], mode: 'saisie' }, rng); while (g.raw.answer !== 'Canberra');
    expect(g.check('').status).toBe('retry');
    const r = g.check('Sydney');
    expect(r.status).toBe('ko'); expect(r.feedback).toMatch(/1908/);
  });
  it('available() faux sans question', () => {
    expect(custom.available({ themes: [cat.id] })).toBe(true);
    expect(custom.available({ themes: ['inconnu'] })).toBe(false);
  });
});

describe('store : catégories', () => {
  it('persistées et relues avant les alarmes', () => {
    const st = mem(), s = createStore(st);
    const c = s.saveCategory(CAPITALES);
    const a = newAlarm(); a.challenge.custom = { on: true, themes: [c.id], count: 2, mode: 'saisie' };
    s.save(a);
    const s2 = createStore(st);
    expect(s2.categories()[0].name).toBe('Capitales');
    expect(s2.list()[0].challenge.custom).toEqual({ on: true, themes: [c.id], count: 2, mode: 'saisie' });
  });
  it('import fusionné par nom, sans doublon', () => {
    const s = createStore(mem());
    expect(s.importCategories(JSON.stringify([CAPITALES]))).toEqual({ created: 1, added: 4, skipped: 0 });
    expect(s.importCategories(JSON.stringify([CAPITALES]))).toEqual({ created: 0, added: 0, skipped: 0 });
    const more = { name: 'capitales', questions: [{ question: 'Capitale de l’Italie ?', answer: 'Rome' }] };
    expect(s.importCategories(JSON.stringify(more))).toEqual({ created: 0, added: 1, skipped: 0 });
    expect(s.categories()).toHaveLength(1);
    expect(s.categories()[0].questions).toHaveLength(5);
  });
  it('supprimer une catégorie la retire des alarmes ; annuler la rétablit', () => {
    const s = createStore(mem());
    const c = s.saveCategory(CAPITALES);
    const a = newAlarm(); a.challenge.custom = { on: true, themes: [c.id], count: 1, mode: 'qcm' };
    const saved = s.save(a);
    const undo = s.removeCategory(c.id);
    expect(s.get(saved.id).challenge.custom.themes).toEqual([]);
    undo();
    expect(s.categories()).toHaveLength(1);
    expect(s.get(saved.id).challenge.custom.themes).toEqual([c.id]);
  });
  it('validation et défi', () => {
    const s = createStore(mem());
    const a = newAlarm(); a.challenge.math.on = false; a.challenge.custom = { on: true, themes: [], count: 1, mode: 'qcm' };
    expect(validateAlarm(a)).toMatch(/aucune catégorie/);
    const c = s.saveCategory(CAPITALES);
    a.challenge.custom.themes = [c.id];
    expect(validateAlarm(a)).toBeNull();
    const ch = createChallenge(a.challenge, { rng: seeded(3) });
    expect(ch.current.module).toBe('custom');
  });
});
