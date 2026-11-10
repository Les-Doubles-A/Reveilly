import { describe, it, expect } from 'vitest';
import { createStore, newAlarm, normalizeAlarm, validateAlarm } from '../src/core/store.js';

const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };

describe('store', () => {
  it('AC-F1-1 : liste triée par heure, persistée', () => {
    const st = mem(), s = createStore(st);
    s.save(newAlarm({ hour: 17, minute: 40 })); s.save(newAlarm({ hour: 6, minute: 45 }));
    expect(createStore(st).list().map(a => a.hour)).toEqual([6, 17]);
  });
  it('AC-F1-2 : toggle désactive', () => {
    const s = createStore(mem()), a = s.save(newAlarm());
    s.toggle(a.id, false);
    expect(s.get(a.id).enabled).toBe(false);
  });
  it('AC-F1-3 : dupliquer crée une copie avec un nouvel id', () => {
    const s = createStore(mem()), a = s.save(newAlarm({ label: 'Cours', hour: 6 }));
    const c = s.duplicate(a.id);
    expect(c.id).not.toBe(a.id);
    expect({ ...c, id: 0, createdAt: 0 }).toEqual({ ...a, id: 0, createdAt: 0 });
    expect(s.list()).toHaveLength(2);
  });
  it('AC-F1-4 : supprimer puis annuler', () => {
    const s = createStore(mem()), a = s.save(newAlarm());
    const undo = s.remove(a.id);
    expect(s.list()).toHaveLength(0);
    undo();
    expect(s.get(a.id)).not.toBeNull();
  });
  it('stockage corrompu → liste vide, données conservées à part', () => {
    const st = mem(); st.setItem('reveilly:alarms:v1', '{oops');
    expect(createStore(st).list()).toEqual([]);
    expect(st.getItem('reveilly:alarms:v1:corrupt')).toBe('{oops');
  });
});

describe('normalize / validate', () => {
  it('assainit les valeurs', () => {
    const a = normalizeAlarm({ hour: 99, minute: -3, days: [9, 1, 1, 'x'], label: 'x'.repeat(80), challenge: { math: { on: true, themes: ['tables', 'nope'], count: 50 } } });
    expect([a.hour, a.minute, a.days, a.label.length]).toEqual([23, 0, [1], 40]);
    expect(a.challenge.math).toEqual({ on: true, themes: ['tables'], count: 10 });
  });
  it('AC-F3-4 : aucun module actif → refus', () => {
    const a = newAlarm(); a.challenge.math.on = false; a.challenge.figures.on = false;
    expect(validateAlarm(a)).toMatch(/au moins un module/);
  });
  it('module actif sans thème → refus', () => {
    const a = newAlarm(); a.challenge.figures.on = true; a.challenge.figures.themes = [];
    expect(validateAlarm(a)).toMatch(/Figures de style/);
  });
  it('défaut valide', () => expect(validateAlarm(newAlarm())).toBeNull());
});
