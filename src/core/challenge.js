/* Session de défi : il faut `total` bonnes réponses ; une mauvaise réponse ne compte pas
   et une nouvelle question du même module la remplace. */
import { moduleById } from '../modules/index.js';
import { shuffle } from './util.js';

export function createChallenge(challenge, { rng = Math.random, limit } = {}) {
  let slots = [];
  for (const [id, c] of Object.entries(challenge || {})) {
    if (c?.on && moduleById(id) && c.themes?.length) for (let i = 0; i < c.count; i++) slots.push(id);
  }
  slots = shuffle(slots, rng);
  if (limit) slots = slots.slice(0, limit);
  if (!slots.length) slots = ['math'];
  const seen = new Set();
  const s = {
    total: slots.length, done: 0, wrong: 0, current: null, last: null,
    get finished() { return s.done >= s.total; },
    next() {
      if (s.finished) return (s.current = null);
      const id = slots[s.done], m = moduleById(id), cfg = challenge?.[id] || {};
      let q;
      for (let i = 0; i < 8; i++) { q = m.generate({ themes: cfg.themes, mode: cfg.mode }, rng); if (!seen.has(q.key)) break; }
      seen.add(q.key);
      s.last = null;
      return (s.current = q);
    },
    /* status : 'ok' | 'ko' | 'retry' (saisie invalide : on ne corrige pas) */
    answer(value) {
      if (!s.current || s.last) return s.last;
      const r = s.current.check(value);
      if (r.status === 'retry') return r;
      if (r.status === 'ok') s.done++; else s.wrong++;
      return (s.last = r);
    },
    skip() {
      if (!s.current || s.last) return s.last;
      s.wrong++;
      return (s.last = { ...s.current.reveal(), skipped: true });
    }
  };
  s.next();
  return s;
}
