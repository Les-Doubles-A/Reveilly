/* Écran E1 « Alarmes à venir ». */
import { esc } from '../core/util.js';
import { DAY_LETTERS, DAY_NAMES, nextOccurrence, formatUntil, formatTime } from '../core/time.js';
import { $, $$, ICON, toggle, toast } from './dom.js';

export function renderList(root, { store, app }) {
  const alarms = store.list();
  const now = new Date();
  const next = alarms.map(a => [a, nextOccurrence(a, now)]).filter(x => x[1]).sort((x, y) => x[1] - y[1])[0];

  root.innerHTML = `<main class="screen list">
    <header class="top"><h1>Alarmes à venir</h1>
      <p class="next" aria-live="polite">${next ? `Prochaine sonnerie ${formatUntil(next[1] - now)}${next[0].label ? ` · ${esc(next[0].label)}` : ''}` : alarms.length ? 'Aucune alarme active' : ''}</p>
    </header>
    <div id="warn"></div>
    ${alarms.length ? `<ul class="cards">${alarms.map(card).join('')}</ul>` : `<div class="empty"><img src="logo.png" alt="" width="96" height="94"><p>Aucune alarme pour l’instant.</p><p class="mut">Touchez <b>+</b> pour créer votre premier réveil à questions.</p></div>`}
    <button type="button" class="fab" id="add" aria-label="Nouvelle alarme">${ICON.plus}</button>
  </main>`;

  app.permissionWarning($('#warn', root));

  $('#add', root).onclick = () => app.edit(null);
  $$('.card', root).forEach(el => {
    const id = el.dataset.id;
    el.onclick = e => { if (!e.target.closest('button,.menu')) app.edit(id); };
    el.onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); app.edit(id); } };
    $('.switch', el).onclick = () => {
      const a = store.toggle(id, !store.get(id).enabled);
      app.haptic();
      if (a.enabled) { const n = nextOccurrence(a); toast(`Sonnera ${formatUntil(n - new Date())}`); }
      app.refresh();
    };
    $('.more', el).onclick = e => {
      e.stopPropagation();
      const open = el.classList.toggle('menu-open');
      $$('.card.menu-open', root).forEach(c => c !== el && c.classList.remove('menu-open'));
      $('.more', el).setAttribute('aria-expanded', open);
      if (open) $('.menu button', el).focus();
    };
    $('[data-act=del]', el).onclick = () => {
      const undo = store.remove(id);
      app.refresh(); toast('Alarme supprimée', { label: 'Annuler', run: () => { undo(); app.refresh(); } });
    };
    $('[data-act=dup]', el).onclick = () => { store.duplicate(id); app.refresh(); toast('Alarme dupliquée'); };
  });
  root.onclick = e => { if (!e.target.closest('.more,.menu')) $$('.card.menu-open', root).forEach(c => c.classList.remove('menu-open')); };
}

function card(a) {
  const days = DAY_LETTERS.map((l, i) => `<span class="${a.days.includes(i) ? 'on' : ''}">${l}</span>`).join('');
  const daysLabel = a.days.length ? a.days.map(i => DAY_NAMES[i]).join(', ') : 'une seule fois';
  return `<li class="card ${a.enabled ? 'active' : ''}" data-id="${a.id}" tabindex="0" aria-label="Alarme ${a.hour} heures ${a.minute}${a.label ? ', ' + esc(a.label) : ''}, ${daysLabel}${a.enabled ? '' : ', désactivée'}. Toucher pour modifier.">
    <div class="days" aria-hidden="true">${days}${a.label ? `<em>${esc(a.label)}</em>` : ''}</div>
    <div class="row"><span class="time">${formatTime(a.hour, a.minute)}</span>${toggle(a.enabled, `Activer l’alarme de ${a.hour} h ${a.minute}`)}</div>
    <button type="button" class="more" aria-label="Plus d’actions" aria-haspopup="menu" aria-expanded="false">${ICON.dots}</button>
    <div class="menu" role="menu">
      <button type="button" role="menuitem" data-act="del">${ICON.trash}Supprimer</button>
      <button type="button" role="menuitem" data-act="dup">${ICON.copy}Dupliquer</button>
    </div>
  </li>`;
}
