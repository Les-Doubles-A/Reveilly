import { describe, it, expect } from 'vitest';
import { nextOccurrence, formatUntil, describeDays } from '../src/core/time.js';

const at = (s) => new Date(s); // heure locale
const A = (o) => ({ enabled: true, hour: 17, minute: 40, days: [0, 1, 2, 3, 4], ...o });

describe('nextOccurrence', () => {
  it('AC-F2-1 : vendredi 18:00, alarme L→V 17:40 → lundi 17:40', () => {
    const n = nextOccurrence(A(), at('2026-10-23T18:00:00')); // vendredi 23 octobre 2026
    expect(n.getDay()).toBe(1);
    expect([n.getDate(), n.getHours(), n.getMinutes()]).toEqual([26, 17, 40]);
  });
  it('même jour si l’heure n’est pas passée', () => {
    const n = nextOccurrence(A(), at('2026-10-23T08:00:00'));
    expect([n.getDate(), n.getHours()]).toEqual([23, 17]);
  });
  it('AC-F2-2 : sans jour, 6:45 vu à 7:00 → lendemain 6:45', () => {
    const n = nextOccurrence(A({ days: [], hour: 6, minute: 45 }), at('2026-10-23T07:00:00'));
    expect([n.getDate(), n.getHours(), n.getMinutes()]).toEqual([24, 6, 45]);
  });
  it('strictement après maintenant (même minute → semaine suivante)', () => {
    const n = nextOccurrence(A({ days: [4] }), at('2026-10-23T17:40:00'));
    expect(n.getDate()).toBe(30);
  });
  it('passage de mois et de minuit', () => {
    const n = nextOccurrence(A({ days: [6], hour: 0, minute: 5 }), at('2026-10-31T23:59:00')); // samedi
    expect([n.getMonth(), n.getDate(), n.getHours()]).toEqual([10, 1, 0]); // dimanche 1er novembre
  });
  it('désactivée → null', () => expect(nextOccurrence(A({ enabled: false }))).toBeNull());
});

describe('affichage', () => {
  it('formatUntil', () => {
    expect(formatUntil(9 * 3600e3 + 12 * 60e3)).toBe('dans 9 h 12');
    expect(formatUntil(3 * 60e3)).toBe('dans 3 min');
    expect(formatUntil(20e3)).toBe('dans moins d’une minute');
    expect(formatUntil(2 * 86400e3 + 3600e3)).toBe('dans 2 j 1 h');
  });
  it('describeDays', () => {
    expect(describeDays([0, 1, 2, 3, 4])).toBe('En semaine');
    expect(describeDays([])).toBe('Une seule fois');
    expect(describeDays([5, 6])).toBe('Le week-end');
  });
});
