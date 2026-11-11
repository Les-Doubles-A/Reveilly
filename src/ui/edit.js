/* Écran E2 : création et modification d'une alarme. */
import { esc } from '../core/util.js';
import { DAY_LETTERS, DAY_NAMES, nextOccurrence, formatUntil } from '../core/time.js';
import { newAlarm, validateAlarm } from '../core/store.js';
import { BUILTIN_SOUNDS, soundName, effectiveVolume } from '../core/audio.js';
import { MODULES } from '../modules/index.js';
import { $, $$, ICON, toggle, toast } from './dom.js';
import { mountWheel } from './wheel.js';

export function renderEdit(root, { store, app, platform, id }) {
  const existing = id && store.get(id);
  const a = existing ? structuredClone(existing) : newAlarm();
  let previewing = false;

  root.innerHTML = `<main class="screen edit">
    <header class="bar"><button type="button" class="icon-btn" id="back" aria-label="Retour sans enregistrer">${ICON.back}</button><span>${existing ? 'Modifier l’alarme' : 'Nouvelle alarme'}</span></header>
    <input id="label" class="name" maxlength="40" placeholder="Saisissez le nom de votre réveil" aria-label="Nom du réveil" value="${esc(a.label)}" autocomplete="off" enterkeyhint="done">
    <div class="wheels panel"><div id="wh"></div><span class="colon" aria-hidden="true">:</span><div id="wm"></div></div>
    <p class="until" id="until" aria-live="polite"></p>
    <div class="daychips" role="group" aria-label="Jours de répétition">${DAY_LETTERS.map((l, i) =>
      `<button type="button" data-d="${i}" aria-pressed="${a.days.includes(i)}" aria-label="${DAY_NAMES[i]}">${l}</button>`).join('')}</div>
    <section class="modules" aria-label="Questions pour arrêter l’alarme">${MODULES.map(m => modBlock(m, a.challenge[m.id])).join('')}</section>
    <p class="total" id="total"></p>
    <section class="sound panel" aria-label="Son">
      <button type="button" class="sound-name" id="sname" aria-expanded="false">${ICON.note}<span>${esc(soundName(a.sound))}</span>${ICON.chevron}</button>
      <div class="sound-list" id="slist" hidden></div>
      <div class="sound-row">
        <button type="button" class="icon-btn" id="play" aria-label="Écouter">${ICON.play}</button>
        <input type="range" id="vol" min="5" max="100" step="5" value="${Math.round(a.volume * 100)}" aria-label="Volume de l’alarme">
        <span class="mut vol-lbl" aria-hidden="true">Volume</span>
      </div>
      <div class="sound-opts"><button type="button" class="chip-btn" id="vib" aria-pressed="${a.vibrate}">${ICON.vibrate}<span>Vibration</span></button></div>
    </section>
    <p class="err" id="err" role="alert"></p>
    <button type="button" class="save" id="save">Enregistrer</button>
  </main>`;

  const wh = mountWheel($('#wh', root), { count: 24, value: a.hour, label: 'Heures', unit: 'h', onChange: v => { a.hour = v; until(); } });
  const wm = mountWheel($('#wm', root), { count: 60, value: a.minute, label: 'Minutes', unit: 'min', onChange: v => { a.minute = v; until(); } });
  void wh; void wm;

  function until() {
    const n = nextOccurrence({ ...a, enabled: true });
    $('#until', root).textContent = n ? `Sonnera ${formatUntil(n - new Date())}` : '';
  }
  function total() {
    const t = MODULES.reduce((s, m) => s + (a.challenge[m.id].on ? a.challenge[m.id].count : 0), 0);
    $('#total', root).textContent = t ? `Pour l’arrêter : ${t} bonne${t > 1 ? 's' : ''} réponse${t > 1 ? 's' : ''}` : '';
    MODULES.forEach(m => { $(`.mod[data-m="${m.id}"] .mod-sum`, root).textContent = summary(m, a.challenge[m.id]); });
  }
  until(); total();

  $('#back', root).onclick = () => { platform.stopPreview(); app.list(); };
  $('#label', root).oninput = e => { a.label = e.target.value; };
  $('#label', root).onkeydown = e => { if (e.key === 'Enter') e.target.blur(); };
  $$('.daychips button', root).forEach(b => b.onclick = () => {
    const d = +b.dataset.d, on = !a.days.includes(d);
    a.days = on ? [...a.days, d].sort() : a.days.filter(x => x !== d);
    b.setAttribute('aria-pressed', on); app.haptic(); until();
  });

  /* Modules : interrupteur, panneau des thèmes, mode, nombre de questions. */
  $$('.mod', root).forEach(el => {
    const m = MODULES.find(x => x.id === el.dataset.m), c = a.challenge[m.id], panel = $('.mod-panel', el), head = $('.mod-name', el);
    const open = v => { panel.hidden = !v; head.setAttribute('aria-expanded', v); el.classList.toggle('open', v); };
    $('.switch', el).onclick = () => {
      c.on = !c.on; $('.switch', el).setAttribute('aria-checked', c.on); el.classList.toggle('on', c.on);
      if (c.on && !c.themes.length) c.themes = [...m.defaults.themes];
      open(c.on); syncThemes(); app.haptic(); total(); clearErr();
    };
    head.onclick = () => open(panel.hidden);
    const syncThemes = () => {
      $$('input[data-t]', el).forEach(i => { i.checked = c.themes.includes(i.dataset.t); });
      $('.all', el).textContent = c.themes.length === m.themes.length ? 'Tout décocher' : 'Tout cocher';
      $('.all', el).hidden = !m.themes.length;
    };
    $$('input[data-t]', el).forEach(i => i.onchange = () => {
      c.themes = m.themes.map(t => t.id).filter(t => t === i.dataset.t ? i.checked : c.themes.includes(t));
      syncThemes(); total(); clearErr();
    });
    $('.all', el).onclick = () => { c.themes = c.themes.length === m.themes.length ? [] : m.themes.map(t => t.id); syncThemes(); total(); };
    $$('[data-mode]', el).forEach(b => b.onclick = () => {
      c.mode = b.dataset.mode; $$('[data-mode]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); total();
    });
    $$('[data-step]', el).forEach(b => b.onclick = () => {
      c.count = Math.min(10, Math.max(1, c.count + +b.dataset.step)); $('.count', el).textContent = c.count; app.haptic(); total();
    });
    syncThemes();
  });

  /* Son */
  const slist = $('#slist', root);
  const renderSounds = () => {
    const opts = [...BUILTIN_SOUNDS, ...(a.sound.kind === 'file' ? [a.sound] : [])];
    slist.innerHTML = opts.map((s, i) => `<button type="button" role="radio" aria-checked="${s.kind === a.sound.kind}" data-i="${i}">${esc(soundName(s))}</button>`).join('')
      + `<button type="button" id="file">Choisir un fichier…</button>`;
    $$('[data-i]', slist).forEach(b => b.onclick = () => { a.sound = { ...opts[+b.dataset.i] }; pickDone(); });
    $('#file', slist).onclick = async () => {
      try { const s = await platform.pickSound(); if (s) { a.sound = s; pickDone(); } }
      catch { toast('Impossible de lire ce fichier : sonnerie par défaut conservée.'); }
    };
  };
  const pickDone = () => { $('#sname span', root).textContent = soundName(a.sound); renderSounds(); stopPreview(); };
  renderSounds();
  $('#sname', root).onclick = () => { slist.hidden = !slist.hidden; $('#sname', root).setAttribute('aria-expanded', !slist.hidden); $('#sname', root).classList.toggle('open', !slist.hidden); };
  const stopPreview = () => { previewing = false; platform.stopPreview(); $('#play', root).innerHTML = ICON.play; $('#play', root).setAttribute('aria-label', 'Écouter'); };
  $('#play', root).onclick = async () => {
    if (previewing) return stopPreview();
    previewing = true; $('#play', root).innerHTML = ICON.stop; $('#play', root).setAttribute('aria-label', 'Arrêter l’écoute');
    try { await platform.preview(a.sound, effectiveVolume(a.volume, store.settings())); } catch { toast('Lecture impossible.'); }
    setTimeout(() => previewing && stopPreview(), 6000);
  };
  $('#vol', root).oninput = e => { a.volume = e.target.value / 100; };
  $('#vib', root).onclick = e => { a.vibrate = !a.vibrate; e.currentTarget.setAttribute('aria-pressed', a.vibrate); app.haptic(30); };

  const clearErr = () => { $('#err', root).textContent = ''; };
  $('#save', root).onclick = () => {
    a.label = $('#label', root).value.trim();
    const err = validateAlarm(a);
    if (err) { $('#err', root).textContent = err; return; }
    stopPreview();
    const saved = store.save({ ...a, enabled: true });
    app.list();
    app.askNotifications();
    toast(`Alarme enregistrée · sonnera ${formatUntil(nextOccurrence(saved) - new Date())}`);
  };
}

function summary(m, c) {
  if (!c.on) return '';
  const th = c.themes.length && c.themes.length === m.themes.length ? 'tous les thèmes' : `${c.themes.length} thème${c.themes.length > 1 ? 's' : ''}`;
  const mode = m.modes ? ' · ' + m.modes.find(x => x.id === c.mode).label.toLowerCase() : '';
  return `${c.count} question${c.count > 1 ? 's' : ''} · ${th}${mode}`;
}

function modBlock(m, c) {
  return `<div class="mod ${c.on ? 'on' : ''}" data-m="${m.id}">
    <div class="mod-row">${toggle(c.on, `Activer ${m.name}`)}
      <button type="button" class="mod-name" aria-expanded="false" aria-controls="p-${m.id}"><span>${esc(m.short)}</span>${ICON.chevron}</button>
      <span class="mod-sum"></span></div>
    <div class="mod-panel" id="p-${m.id}" hidden>
      <div class="mod-head"><b>${esc(m.name)}</b><button type="button" class="lnk all"></button></div>
      ${!m.themes.length && m.emptyHint ? `<p class="mut">${esc(m.emptyHint)}</p>` : ''}
      <div class="themes">${m.themes.map(t => `<label title="${esc(t.hint || '')}"><input type="checkbox" data-t="${t.id}" ${c.themes.includes(t.id) ? 'checked' : ''}><span>${esc(t.label)}</span></label>`).join('')}</div>
      ${m.modes ? `<div class="seg" role="group" aria-label="Mode de réponse">${m.modes.map(x => `<button type="button" data-mode="${x.id}" aria-pressed="${c.mode === x.id}">${esc(x.label)}</button>`).join('')}</div>` : ''}
      <div class="stepper"><span>Nombre de questions</span>
        <button type="button" data-step="-1" aria-label="Une question de moins">−</button><b class="count" aria-live="polite">${c.count}</b><button type="button" data-step="1" aria-label="Une question de plus">+</button></div>
    </div>
  </div>`;
}
