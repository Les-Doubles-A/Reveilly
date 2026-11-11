/* Alarmes et réglages, persistés en localStorage (quelques Ko). */
import { MODULES } from '../modules/index.js';
import { setCustomCategories, normalizeCategory, normalizeCategories, parseCategories, LIMITS } from '../modules/custom.js';
import { uid, clamp } from './util.js';

const KEY = 'reveilly:alarms:v1', SKEY = 'reveilly:settings:v1', CKEY = 'reveilly:categories:v1';

export const DEFAULT_SETTINGS = { rampSeconds: 30, maxRingMinutes: 15, idleSeconds: 20, masterVolume: 1, haptics: true };

export function defaultChallenge() {
  return Object.fromEntries(MODULES.map((m, i) => [m.id, {
    on: i === 0, themes: [...m.defaults.themes], count: m.defaults.count, ...(m.modes ? { mode: m.defaults.mode } : {})
  }]));
}

export function newAlarm(over = {}) {
  return normalizeAlarm({ hour: 7, minute: 0, days: [0, 1, 2, 3, 4], ...over });
}

/* Complète et assainit une alarme relue du stockage (données jamais supposées valides). */
export function normalizeAlarm(a = {}) {
  const int = (v, lo, hi, d) => Number.isInteger(+v) && v !== '' && v !== null ? clamp(+v, lo, hi) : d;
  const ch = defaultChallenge(), src = a.challenge || {};
  for (const m of MODULES) {
    const c = src[m.id];
    if (!c) continue;
    const valid = new Set(m.themes.map(t => t.id));
    ch[m.id] = {
      on: !!c.on,
      themes: Array.isArray(c.themes) ? [...new Set(c.themes.filter(t => valid.has(t)))] : ch[m.id].themes,
      count: int(c.count, 1, 10, ch[m.id].count),
      ...(m.modes ? { mode: m.modes.some(x => x.id === c.mode) ? c.mode : m.defaults.mode } : {})
    };
  }
  const sound = a.sound && ['default', 'melodie', 'bips', 'file'].includes(a.sound.kind) ? { ...a.sound } : { kind: 'default' };
  return {
    id: typeof a.id === 'string' && a.id ? a.id : uid(),
    label: String(a.label ?? '').slice(0, 40),
    hour: int(a.hour, 0, 23, 7),
    minute: int(a.minute, 0, 59, 0),
    days: Array.isArray(a.days) ? [...new Set(a.days.map(Number).filter(d => d >= 0 && d <= 6))].sort() : [],
    enabled: a.enabled !== false,
    sound,
    volume: typeof a.volume === 'number' ? clamp(a.volume, 0.05, 1) : 0.8,
    vibrate: a.vibrate !== false,
    challenge: ch,
    createdAt: a.createdAt || Date.now()
  };
}

/* Message d'erreur, ou null si l'alarme peut être enregistrée. */
export function validateAlarm(a) {
  const on = MODULES.filter(m => a.challenge[m.id]?.on);
  if (!on.length) return 'Activez au moins un module de questions.';
  const empty = on.find(m => !a.challenge[m.id].themes.length);
  if (empty) return empty.themes.length ? `Choisissez au moins un thème pour « ${empty.name} ».` : `« ${empty.name} » : aucune catégorie. Créez-en dans les Réglages.`;
  const dry = on.find(m => m.available && !m.available(a.challenge[m.id]));
  if (dry) return `« ${dry.name} » : les catégories choisies ne contiennent aucune question.`;
  return null;
}

export const sortAlarms = list => list.slice().sort((x, y) => x.hour * 60 + x.minute - (y.hour * 60 + y.minute) || x.createdAt - y.createdAt);

const memory = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const browserStorage = () => { try { const s = globalThis.localStorage; s.setItem('reveilly:probe', '1'); s.removeItem('reveilly:probe'); return s; } catch { return memory(); } };

export function createStore(storage = browserStorage()) {
  const listeners = new Set();
  const read = (k, d) => { try { const v = JSON.parse(storage.getItem(k)); return v ?? d; } catch { try { storage.setItem(k + ':corrupt', storage.getItem(k)); } catch {} return d; } };
  /* Les catégories d'abord : les thèmes du module « Mes questions » en dépendent. */
  let cats = normalizeCategories(read(CKEY, []));
  setCustomCategories(cats);
  let alarms = (Array.isArray(read(KEY, [])) ? read(KEY, []) : []).map(normalizeAlarm);
  let settings = { ...DEFAULT_SETTINGS, ...read(SKEY, {}) };
  const persist = () => { try { storage.setItem(KEY, JSON.stringify(alarms)); } catch {} listeners.forEach(f => f()); };
  /* Une catégorie supprimée disparaît aussi des alarmes. */
  const persistCats = () => {
    setCustomCategories(cats);
    try { storage.setItem(CKEY, JSON.stringify(cats)); } catch {}
    alarms = alarms.map(normalizeAlarm);
    persist();
  };

  return {
    list: () => sortAlarms(alarms),
    get: id => alarms.find(a => a.id === id) || null,
    save(a) {
      const n = normalizeAlarm(a), i = alarms.findIndex(x => x.id === n.id);
      if (i >= 0) alarms[i] = n; else alarms.push(n);
      persist(); return n;
    },
    toggle(id, on) { const a = alarms.find(x => x.id === id); if (a) { a.enabled = on; persist(); } return a; },
    duplicate(id) {
      const a = alarms.find(x => x.id === id); if (!a) return null;
      const c = normalizeAlarm({ ...structuredClone(a), id: uid(), createdAt: Date.now() });
      alarms.push(c); persist(); return c;
    },
    /* Supprime et renvoie une fonction d'annulation. */
    remove(id) {
      const i = alarms.findIndex(x => x.id === id); if (i < 0) return () => {};
      const [gone] = alarms.splice(i, 1); persist();
      return () => { if (!alarms.some(x => x.id === gone.id)) { alarms.push(gone); persist(); } };
    },
    categories: () => structuredClone(cats),
    category: id => structuredClone(cats.find(c => c.id === id) || null),
    saveCategory(c) {
      const n = normalizeCategory(c), i = cats.findIndex(x => x.id === n.id);
      if (i >= 0) cats[i] = n; else if (cats.length < LIMITS.categories) cats.push(n); else throw new Error(`${LIMITS.categories} catégories au maximum.`);
      persistCats(); return structuredClone(n);
    },
    removeCategory(id) {
      const i = cats.findIndex(x => x.id === id); if (i < 0) return () => {};
      const before = structuredClone(alarms), [gone] = cats.splice(i, 1); persistCats();
      return () => {
        if (cats.some(x => x.id === gone.id)) return;
        cats.splice(Math.min(i, cats.length), 0, gone); setCustomCategories(cats);
        try { storage.setItem(CKEY, JSON.stringify(cats)); } catch {}
        alarms = before.map(normalizeAlarm); persist();
      };
    },
    /* Fusion par nom : une catégorie du même nom reçoit les questions qui lui manquent.
       Réimporter le même fichier ne crée donc pas de doublons. */
    importCategories(json) {
      const incoming = parseCategories(json), key = s => s.toLowerCase().trim();
      let added = 0, created = 0, skipped = 0;
      for (const c of incoming) {
        let t = cats.find(x => key(x.name) === key(c.name));
        if (!t) {
          if (cats.length >= LIMITS.categories) { skipped += c.questions.length; continue; }
          t = normalizeCategory({ name: c.name }); cats.push(t); created++;
        }
        const known = new Set(t.questions.map(q => key(q.question)));
        for (const q of c.questions) {
          if (known.has(key(q.question))) continue;
          if (t.questions.length >= LIMITS.questions) { skipped++; continue; }
          t.questions.push(q); known.add(key(q.question)); added++;
        }
      }
      persistCats();
      return { created, added, skipped };
    },
    settings: () => ({ ...settings }),
    saveSettings(s) { settings = { ...settings, ...s }; try { storage.setItem(SKEY, JSON.stringify(settings)); } catch {} listeners.forEach(f => f()); return settings; },
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); }
  };
}
