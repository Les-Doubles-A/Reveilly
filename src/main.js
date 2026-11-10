import '@fontsource/cabin/400.css';
import '@fontsource/cabin/500.css';
import '@fontsource/cabin/600.css';
import './styles.css';
import { createStore, newAlarm } from './core/store.js';
import { createPlatform } from './platform/index.js';
import { renderList } from './ui/list.js';
import { renderEdit } from './ui/edit.js';
import { renderSettings } from './ui/settings.js';
import { renderRing } from './ui/ring.js';
import { $, ICON } from './ui/dom.js';

const store = createStore();
const platform = createPlatform();
const root = $('#app'), nav = $('#nav');
let view = 'list', ringing = null, syncTimer;

const TEST_KEY = 'reveilly:test';
const testAlarm = () => { try { return newAlarm(JSON.parse(localStorage.getItem(TEST_KEY))); } catch { return newAlarm({ id: 'test' }); } };

const app = {
  list: () => show('list'),
  settings: () => show('settings'),
  edit: id => show('edit', { id }),
  refresh: () => show(view),
  haptic(ms = 12) { if (store.settings().haptics) platform.haptic(ms); },
  async scheduleTest(seconds) {
    const base = store.list().find(a => a.enabled) || store.list()[0] || newAlarm();
    const t = newAlarm({ ...structuredClone(base), id: 'test', label: 'Test du réveil', days: [] });
    try { localStorage.setItem(TEST_KEY, JSON.stringify(t)); } catch {}
    await platform.scheduleTest(seconds, t);
  },
  /* Android 13+ : on demande les notifications au premier enregistrement, quand l'utilisateur comprend pourquoi. */
  async askNotifications() {
    if (platform.kind === 'web') return;
    const p = (await platform.permissions().catch(() => [])).find(x => x.id === 'notifications');
    if (p && !p.ok) await platform.openSettings('notifications').catch(() => {});
  },
  async permissionWarning(el) {
    if (platform.kind === 'web') {
      el.innerHTML = `<p class="banner info">Aperçu Web : l’alarme ne sonne que si cette page reste ouverte. Installez l’application Android pour un vrai réveil.</p>`;
      return;
    }
    const bad = (await platform.permissions().catch(() => [])).filter(p => !p.ok && !p.optional);
    if (bad.length && el.isConnected) {
      el.innerHTML = `<button type="button" class="banner bad">${ICON.warn}<span>${bad.map(p => p.label).join(', ')} : autorisation manquante, l’alarme risque de ne pas sonner. Toucher pour corriger.</span></button>`;
      el.firstChild.onclick = () => platform.openSettings(bad[0].id);
    }
  }
};

function show(v, params = {}) {
  if (ringing && v !== 'ring') v = 'ring';
  view = v;
  document.body.dataset.view = v;
  nav.hidden = !(v === 'list' || v === 'settings');
  nav.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', b.dataset.go === v ? 'page' : 'false'));
  const ctx = { store, app, platform, ...params };
  if (v === 'list') renderList(root, ctx);
  else if (v === 'settings') renderSettings(root, ctx);
  else if (v === 'edit') renderEdit(root, ctx);
  else if (v === 'ring') renderRing(root, ringing);
  window.scrollTo(0, 0);
}

function ring(r) {
  if (ringing && ringing.id === r.alarmId) return;
  const test = r.test || r.alarmId === 'test';
  const alarm = test ? testAlarm() : store.get(r.alarmId) || newAlarm({ label: 'Réveil' });
  ringing = {
    id: r.alarmId, alarm, test, app,
    idleSeconds: store.settings().idleSeconds,
    pause: seconds => platform.pauseRinging(seconds).catch(e => { console.error('pause', e); return false; }),
    onDone: async () => {
      await platform.stopRinging(r.alarmId);
      if (!test && !alarm.days.length) store.toggle(alarm.id, false);
      ringing = null;
    }
  };
  show('ring');
}

/* Toute modification est répercutée sur la planification (native ou Web). */
const sync = () => { clearTimeout(syncTimer); syncTimer = setTimeout(() => platform.sync(store.list(), store.settings()).catch(e => console.error('sync', e)), 50); };
store.subscribe(sync);

nav.innerHTML = `<button type="button" data-go="list" aria-label="Alarmes">${ICON.alarm}</button><button type="button" data-go="settings" aria-label="Réglages">${ICON.gear}</button>`;
nav.onclick = e => { const b = e.target.closest('[data-go]'); if (b) show(b.dataset.go); };

async function boot() {
  platform.init(ring);
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) return;
    for (const id of await platform.consumeFired().catch(() => [])) store.toggle(id, false);
  });
  /* Alarmes uniques qui ont sonné pendant que l'app était fermée : on les désactive. */
  for (const id of await platform.consumeFired().catch(() => [])) store.toggle(id, false);
  await platform.sync(store.list(), store.settings()).catch(e => console.error('sync', e));
  const r = await platform.getRinging().catch(() => null);
  if (r) ring(r); else show('list');
  setInterval(() => { if (view === 'list' && !document.hidden && !$('.card.menu-open')) show('list'); }, 30000);
}
boot();
