/* Écran E4 : l'alarme sonne, il faut répondre juste pour l'arrêter. */
import { esc } from '../core/util.js';
import { formatTime } from '../core/time.js';
import { createChallenge } from '../core/challenge.js';
import { $, $$, ICON } from './dom.js';

export function renderRing(root, { alarm, test, app, onDone, idleSeconds = 0, pause = () => {} }) {
  const s = createChallenge(alarm.challenge, { limit: test ? 1 : undefined });
  const started = Date.now();
  let typed = '', clock, lastActivity = 0, lastSent = 0, trailing, pauseFailed = false;

  /* Toucher l'écran coupe la sonnerie ; elle reprend après `idleSeconds` sans activité.
     Le natif reprend seul si plus aucun signal n'arrive (application quittée ou fermée). */
  const send = async () => { lastSent = Date.now(); pauseFailed = (await pause(idleSeconds)) === false; };
  const activity = () => {
    if (!idleSeconds || s.finished) return;
    lastActivity = Date.now();
    clearTimeout(trailing);
    const wait = 1000 - (lastActivity - lastSent);
    if (wait <= 0) send(); else trailing = setTimeout(send, wait);
  };
  root.onpointerdown = activity; root.onkeydown = activity; root.oninput = activity;
  const onHide = () => { if (document.hidden && idleSeconds && !s.finished) { clearTimeout(trailing); lastActivity = 0; pause(0); } };
  document.addEventListener('visibilitychange', onHide);
  const idleText = () => {
    if (!idleSeconds || s.finished) return '';
    if (pauseFailed) return 'Le son n’a pas pu être coupé : réponds juste pour arrêter l’alarme';
    const left = Math.ceil(idleSeconds - (Date.now() - lastActivity) / 1000);
    return lastActivity && left > 0 ? `Sonnerie en pause · reprend dans ${left} s sans activité` : 'Touchez l’écran pour couper le son le temps de répondre';
  };
  const idleTimer = setInterval(() => {
    const el = $('#idle', root);
    if (!el) { clearInterval(idleTimer); document.removeEventListener('visibilitychange', onHide); return; }
    el.textContent = idleText(); el.classList.toggle('on', !!lastActivity && idleText().startsWith('Sonnerie'));
  }, 500);

  const frame = inner => {
    const now = new Date();
    root.innerHTML = `<main class="screen ring" aria-live="polite">
      <header class="ring-top">
        <div class="ring-clock" id="clock">${formatTime(now.getHours(), now.getMinutes())}</div>
        <div class="ring-label">${esc(alarm.label || (test ? 'Test du réveil' : 'Réveil'))}</div>
        <div class="pips" role="progressbar" aria-label="Bonnes réponses" aria-valuemin="0" aria-valuemax="${s.total}" aria-valuenow="${s.done}">
          ${Array.from({ length: s.total }, (_, i) => `<i class="${i < s.done ? 'ok' : ''}"></i>`).join('')}</div>
        <p class="pips-txt">${s.finished ? 'Alarme arrêtée' : `${s.done} / ${s.total} · réponds juste pour arrêter l’alarme`}</p>
        <p class="idle" id="idle" aria-live="off">${idleText()}</p>
      </header>${inner}</main>`;
    clearInterval(clock);
    clock = setInterval(() => { const c = $('#clock', root); if (!c) return clearInterval(clock); const n = new Date(); c.textContent = formatTime(n.getHours(), n.getMinutes()); }, 5000);
  };

  function question() {
    const q = s.current; typed = '';
    let input;
    if (q.input === 'choice') {
      input = `<div class="choices">${q.choices.map((c, i) => `<button type="button" data-c="${i}">${esc(c)}</button>`).join('')}</div>`;
    } else if (q.input === 'keypad') {
      input = `<div class="answer" id="disp" role="textbox" aria-label="Ta réponse" aria-readonly="true"><span id="typed"></span><i class="caret"></i></div>
        <div class="keypad">${['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', ','].map(k => `<button type="button" data-k="${k}">${k}</button>`).join('')}
          <button type="button" data-k="/" aria-label="Barre de fraction">/</button>
          <button type="button" data-k="del" aria-label="Effacer">${ICON.backspace}</button>
          <button type="button" class="ok" id="ok">Valider</button></div>`;
    } else {
      input = `<form id="frm" class="text-answer" autocomplete="off"><input id="txt" type="text" placeholder="${esc(q.placeholder || 'Nom de la figure…')}" aria-label="Ta réponse" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="done"><button class="ok" type="submit">Valider</button></form>`;
    }
    frame(`<section class="qcard">${q.prompt}<p class="msg" id="msg" role="alert"></p>${input}
      <button type="button" class="lnk skip" id="skip">Je ne sais pas</button></section>`);

    const msg = t => { $('#msg', root).textContent = t || ''; };
    const submit = v => {
      const r = s.answer(v);
      if (r.status === 'retry') { msg(r.message); app.haptic(60); return; }
      feedback(r);
    };
    $('#skip', root).onclick = () => feedback(s.skip());
    if (q.input === 'choice') $$('[data-c]', root).forEach(b => b.onclick = () => submit(q.choices[+b.dataset.c]));
    if (q.input === 'keypad') {
      const show = () => { $('#typed', root).textContent = typed; msg(); };
      $$('[data-k]', root).forEach(b => b.onclick = () => {
        const k = b.dataset.k; app.haptic(8);
        if (k === 'del') typed = typed.slice(0, -1);
        else if (k === '−') typed = typed.startsWith('−') ? typed.slice(1) : '−' + typed;
        else if (typed.length < 12) typed += k;
        show();
      });
      $('#ok', root).onclick = () => submit(typed);
      document.onkeydown = e => {
        if (!$('#typed', root)) return (document.onkeydown = null);
        if (/^[0-9,./]$/.test(e.key)) typed += e.key === '.' ? ',' : e.key;
        else if (e.key === '-') typed = typed.startsWith('−') ? typed.slice(1) : '−' + typed;
        else if (e.key === 'Backspace') typed = typed.slice(0, -1);
        else if (e.key === 'Enter') return submit(typed);
        else return;
        e.preventDefault(); show();
      };
    }
    if (q.input === 'text') {
      const i = $('#txt', root); i.focus();
      $('#frm', root).onsubmit = e => { e.preventDefault(); submit(i.value); };
    }
  }

  function feedback(r) {
    document.onkeydown = null;
    app.haptic(r.status === 'ok' ? 20 : [80, 60, 80]);
    if (s.finished) return finish();
    frame(`<section class="qcard fb ${r.status}">
      <p class="verdict">${r.status === 'ok' ? ICON.check : ''}${r.title}</p>
      <div class="fb-body">${r.feedback || ''}</div>
      <button type="button" class="save" id="next">${r.status === 'ok' ? 'Question suivante' : 'Nouvelle question'}</button></section>`);
    $('#next', root).focus();
    $('#next', root).onclick = () => { s.next(); question(); };
  }

  function finish() {
    const sec = Math.round((Date.now() - started) / 1000);
    onDone();
    frame(`<section class="qcard done"><img src="logo.png" alt="" width="88" height="86">
      <h2>Bien réveillé !</h2>
      <p>${s.total} bonne${s.total > 1 ? 's' : ''} réponse${s.total > 1 ? 's' : ''}${s.wrong ? `, ${s.wrong} erreur${s.wrong > 1 ? 's' : ''}` : ' sans faute'} en ${sec < 60 ? sec + ' s' : Math.floor(sec / 60) + ' min ' + String(sec % 60).padStart(2, '0')}.</p>
      <button type="button" class="save" id="close">Fermer</button></section>`);
    clearInterval(clock); clearInterval(idleTimer); clearTimeout(trailing);
    document.removeEventListener('visibilitychange', onHide);
    root.onpointerdown = root.onkeydown = root.oninput = null;
    $('#close', root).onclick = () => app.list();
  }

  question();
}
