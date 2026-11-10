import { describe, it, expect } from 'vitest';
import { createChallenge } from '../src/core/challenge.js';
import { defaultChallenge } from '../src/core/store.js';
import { rampVolume } from '../src/core/audio.js';
import { seeded } from '../src/core/util.js';

const right = q => q.input === 'choice' ? q.figure : (q.figure || q.raw.d || String(q.raw.a));
const cfg = () => { const c = defaultChallenge(); c.math = { on: true, themes: ['tables'], count: 2 }; c.figures = { on: true, themes: ['O'], count: 1, mode: 'qcm' }; return c; };

describe('défi', () => {
  it('AC-F3-3 : Math 2 + Figures 1 → 3 bonnes réponses', () => {
    const s = createChallenge(cfg(), { rng: seeded(4) });
    expect(s.total).toBe(3);
    const mods = [];
    while (!s.finished) { mods.push(s.current.module); expect(s.answer(right(s.current)).status).toBe('ok'); s.next(); }
    expect(mods.sort()).toEqual(['figures', 'math', 'math']);
    expect(s.current).toBeNull();
  });
  it('AC-F5-4 : une mauvaise réponse ne fait pas avancer', () => {
    const s = createChallenge(cfg(), { rng: seeded(8) });
    const m = s.current.module;
    const wrong = s.current.input === 'choice' ? s.current.choices.find(c => c !== s.current.figure) : '-99999';
    expect(s.answer(wrong).status).toBe('ko');
    expect(s.done).toBe(0);
    const q2 = s.next();
    expect(q2.module).toBe(m);
  });
  it('AC-F5-3 : terminé après la dernière bonne réponse', () => {
    const c = defaultChallenge(); c.math = { on: true, themes: ['bases'], count: 1 }; c.figures.on = false;
    const s = createChallenge(c);
    s.answer(right(s.current));
    expect(s.finished).toBe(true);
  });
  it('saisie invalide → retry sans pénalité', () => {
    const c = defaultChallenge(); c.figures.on = false;
    const s = createChallenge(c);
    expect(s.answer('abc').status).toBe('retry');
    expect(s.wrong).toBe(0);
  });
  it('« Je ne sais pas » compte comme erreur et montre la réponse', () => {
    const s = createChallenge(cfg());
    const r = s.skip();
    expect(r.status).toBe('ko'); expect(r.answer).toBeTruthy(); expect(s.done).toBe(0);
  });
  it('limit=1 pour le test de réveil', () => expect(createChallenge(cfg(), { limit: 1 }).total).toBe(1));
});

describe('volume progressif', () => {
  it('AC-F6-1 : 10 % → cible en 30 s', () => {
    expect(rampVolume(0.8, 0, 30)).toBeCloseTo(0.1);
    expect(rampVolume(0.8, 15, 30)).toBeCloseTo(0.45);
    expect(rampVolume(0.8, 30, 30)).toBe(0.8);
    expect(rampVolume(0.8, 5, 0)).toBe(0.8);
  });
});

describe('volume général', () => {
  it('multiplie le volume de l’alarme', async () => {
    const { effectiveVolume } = await import('../src/core/audio.js');
    expect(effectiveVolume(0.8, { masterVolume: 0.5 })).toBeCloseTo(0.4);
    expect(effectiveVolume(0.8, {})).toBeCloseTo(0.8);
    expect(effectiveVolume(0.05, { masterVolume: 0.1 })).toBeCloseTo(0.02);
  });
});
