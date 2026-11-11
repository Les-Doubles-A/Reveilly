/* Écran E5 : création et modification d'une catégorie de questions personnelles,
   plus les actions d'import / export JSON partagées avec les réglages. */
import { esc } from '../core/util.js';
import { exportCategories, LIMITS } from '../modules/custom.js';
import { $, ICON, toast } from './dom.js';

const blank = () => ({ question: '', answer: '', accepted: '', wrong: '', explanation: '' });
const lines = v => Array.isArray(v) ? v.join('\n') : v || '';
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'categorie';

export async function exportToFile(platform, cats, name) {
  if (!cats.length) return toast('Aucune catégorie à exporter.');
  try {
    const saved = await platform.saveTextFile(`reveilly-${slug(name)}.json`, exportCategories(cats));
    if (saved) toast(platform.kind === 'web' ? 'Fichier téléchargé.' : 'Fichier enregistré.');
  } catch (e) { toast(e?.message || 'Export impossible.'); }
}

export async function importFromFile({ store, platform, app }) {
  let text;
  try { text = await platform.openTextFile(); } catch (e) { return toast(e?.message || 'Lecture impossible.'); }
  if (text == null) return;
  try {
    const r = store.importCategories(text);
    toast(r.added
      ? `${plural(r.added, 'question')} importée${r.added > 1 ? 's' : ''}${r.created ? ` · ${plural(r.created, 'nouvelle catégorie')}` : ''}${r.skipped ? ` · ${r.skipped} ignorée(s) (limite atteinte)` : ''}`
      : r.skipped ? 'Limite atteinte : rien n’a pu être importé.' : 'Rien de nouveau : ces questions existent déjà.');
    app.refresh();
  } catch (e) { toast(e?.message || 'Import impossible.'); }
}

export function renderCategory(root, { store, app, platform, id }) {
  const existing = id && store.category(id);
  const c = existing || { id: null, name: '', questions: [] };
  if (!c.questions.length) c.questions.push(blank());
  let dirty = false;

  root.innerHTML = `<main class="screen edit cat-edit">
    <header class="bar"><button type="button" class="icon-btn" id="back" aria-label="Retour">${ICON.back}</button><span>${existing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</span></header>
    <input id="cname" class="name" maxlength="${LIMITS.name}" placeholder="Nom de la catégorie" aria-label="Nom de la catégorie" value="${esc(c.name)}" autocomplete="off" enterkeyhint="done">
    <p class="cat-count" id="count" aria-live="polite"></p>
    <ol class="qlist" id="qlist"></ol>
    <button type="button" class="chip-btn add-q" id="addq">${ICON.plus}<span>Ajouter une question</span></button>
    <p class="err" id="err" role="alert"></p>
    <button type="button" class="save" id="save">Enregistrer</button>
    ${existing ? `<div class="cat-io"><button type="button" class="chip-btn" id="exp">Exporter en JSON</button><button type="button" class="chip-btn danger" id="del">${ICON.trash}<span>Supprimer</span></button></div>` : ''}
  </main>`;

  const list = $('#qlist', root);
  const err = (t = '') => { $('#err', root).textContent = t; };
  const count = () => {
    const n = c.questions.filter(q => q.question.trim() && String(q.answer).trim()).length;
    $('#count', root).textContent = plural(n, 'question') + ' complète' + (n > 1 ? 's' : '');
  };
  const item = (q, i, open) => `<li class="qitem" data-i="${i}"><details${open ? ' open' : ''}>
    <summary><span class="qn">${i + 1}</span><span class="qs">${esc(q.question.trim() || 'Nouvelle question')}</span>${ICON.chevron}</summary>
    <div class="qbody">
      <label>Question<textarea data-f="question" rows="2" maxlength="${LIMITS.question}">${esc(q.question)}</textarea></label>
      <label>Bonne réponse<input data-f="answer" maxlength="${LIMITS.answer}" value="${esc(q.answer)}" autocomplete="off"></label>
      <label>Autres réponses acceptées<small>Une par ligne, facultatif (synonymes, abréviations…)</small><textarea data-f="accepted" rows="2">${esc(lines(q.accepted))}</textarea></label>
      <label>Mauvaises réponses pour le choix multiple<small>Une par ligne, facultatif. Sinon, les réponses des autres questions servent de pièges.</small><textarea data-f="wrong" rows="3">${esc(lines(q.wrong))}</textarea></label>
      <label>Explication<small>Affichée après la réponse, facultatif</small><textarea data-f="explanation" rows="2" maxlength="${LIMITS.explanation}">${esc(q.explanation)}</textarea></label>
      <button type="button" class="lnk danger" data-del>Supprimer cette question</button>
    </div></details></li>`;
  const draw = openIndex => {
    list.innerHTML = c.questions.map((q, i) => item(q, i, i === openIndex)).join('');
    count();
  };
  draw(existing ? -1 : 0);

  list.oninput = e => {
    const f = e.target.dataset.f, li = e.target.closest('.qitem');
    if (!f || !li) return;
    const q = c.questions[+li.dataset.i];
    q[f] = e.target.value; dirty = true; err();
    if (f === 'question') $('.qs', li).textContent = q.question.trim() || 'Nouvelle question';
    if (f === 'question' || f === 'answer') count();
  };
  list.onclick = e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    const i = +b.closest('.qitem').dataset.i;
    c.questions.splice(i, 1); dirty = true;
    if (!c.questions.length) c.questions.push(blank());
    draw(-1); app.haptic();
  };
  $('#addq', root).onclick = () => {
    if (c.questions.length >= LIMITS.questions) return err(`${LIMITS.questions} questions au maximum par catégorie.`);
    c.questions.push(blank()); dirty = true;
    draw(c.questions.length - 1);
    const t = $('.qitem:last-child textarea', list); t.scrollIntoView({ block: 'center' }); t.focus();
  };
  $('#cname', root).oninput = () => { dirty = true; err(); };
  $('#cname', root).onkeydown = e => { if (e.key === 'Enter') e.target.blur(); };
  $('#back', root).onclick = () => { if (!dirty || confirm('Quitter sans enregistrer les modifications ?')) app.settings(); };

  $('#save', root).onclick = () => {
    const name = $('#cname', root).value.trim();
    if (!name) { err('Donnez un nom à la catégorie.'); return $('#cname', root).focus(); }
    if (store.categories().some(x => x.id !== c.id && x.name.toLowerCase() === name.toLowerCase())) return err('Une autre catégorie porte déjà ce nom.');
    const bad = c.questions.findIndex(q => !q.question.trim() !== !String(q.answer).trim());
    if (bad >= 0) {
      draw(bad); err(`Question ${bad + 1} : il faut un énoncé et une bonne réponse.`);
      return $(`.qitem[data-i="${bad}"]`, list).scrollIntoView({ block: 'center' });
    }
    const questions = c.questions.filter(q => q.question.trim());
    if (!questions.length) return err('Ajoutez au moins une question avec sa réponse.');
    try {
      const saved = store.saveCategory({ ...(c.id ? { id: c.id } : {}), name, questions });
      dirty = false;
      app.settings();
      toast(`« ${saved.name} » enregistrée · ${plural(saved.questions.length, 'question')}`);
    } catch (e) { err(e?.message || 'Enregistrement impossible.'); }
  };

  if (existing) {
    $('#exp', root).onclick = () => {
      if (dirty) return err('Enregistrez d’abord vos modifications.');
      const cur = store.category(c.id);
      if (cur) exportToFile(platform, [cur], cur.name);
    };
    $('#del', root).onclick = () => {
      if (!confirm(`Supprimer la catégorie « ${c.name} » et ses ${plural(c.questions.length, 'question')} ?`)) return;
      const undo = store.removeCategory(c.id);
      app.settings();
      toast('Catégorie supprimée', { label: 'Annuler', run: () => { undo(); app.refresh(); } });
    };
  }
}
