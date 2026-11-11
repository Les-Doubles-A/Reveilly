/* Module « Mes questions » : catégories créées par l'utilisateur.
   Chaque catégorie devient un thème du module ; la liste est fournie par le store
   (setCustomCategories) avant que les alarmes ne soient relues. */
import { esc, uid, shuffle } from '../core/util.js';
import { parseAnswer } from './math.js';

export const LIMITS = { categories: 50, questions: 500, name: 60, question: 300, answer: 120, list: 10, explanation: 1000 };
export const EXPORT_FORMAT = 'reveilly-categories';

let CATS = [];
export const setCustomCategories = list => { CATS = Array.isArray(list) ? list : []; };
export const getCustomCategories = () => CATS;

/* ---------- Normalisation (données importées ou relues jamais supposées valides) ---------- */
const str = (v, max) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '').replace(/\s+/g, ' ').trim().slice(0, max);
const text = (v, max) => (typeof v === 'string' ? v : '').replace(/\r\n?/g, '\n').trim().slice(0, max);
const list = v => {
  const arr = Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : [];
  const out = [], seen = new Set();
  for (const x of arr) { const s = str(x, LIMITS.answer), k = norm(s); if (s && !seen.has(k)) { seen.add(k); out.push(s); } }
  return out.slice(0, LIMITS.list);
};
const first = (o, ...keys) => { for (const k of keys) if (o[k] !== undefined) return o[k]; };

export function normalizeQuestion(q) {
  if (!q || typeof q !== 'object') return null;
  const answer = str(first(q, 'answer', 'a', 'reponse', 'réponse'), LIMITS.answer);
  const k = norm(answer);
  return {
    question: text(first(q, 'question', 'q'), LIMITS.question),
    answer,
    accepted: list(first(q, 'accepted', 'alternatives')).filter(x => norm(x) !== k),
    wrong: list(first(q, 'wrong', 'distractors')).filter(x => norm(x) !== k),
    explanation: text(first(q, 'explanation', 'explication'), LIMITS.explanation)
  };
}

/* Les questions sans énoncé ou sans réponse sont écartées. */
export function normalizeCategory(c = {}) {
  const qs = Array.isArray(c.questions) ? c.questions : [];
  return {
    id: typeof c.id === 'string' && c.id ? c.id : 'c' + uid(),
    name: str(c.name, LIMITS.name) || 'Sans nom',
    questions: qs.map(normalizeQuestion).filter(q => q && q.question && q.answer).slice(0, LIMITS.questions)
  };
}

export const normalizeCategories = arr => {
  const seen = new Set();
  return (Array.isArray(arr) ? arr : []).filter(c => c && typeof c === 'object').map(normalizeCategory)
    .filter(c => !seen.has(c.id) && seen.add(c.id)).slice(0, LIMITS.categories);
};

/* ---------- Import / export JSON ---------- */
export function exportCategories(cats) {
  return JSON.stringify({
    format: EXPORT_FORMAT, version: 1,
    categories: cats.map(c => ({
      name: c.name,
      questions: c.questions.map(q => ({
        question: q.question, answer: q.answer,
        ...(q.accepted.length ? { accepted: q.accepted } : {}),
        ...(q.wrong.length ? { wrong: q.wrong } : {}),
        ...(q.explanation ? { explanation: q.explanation } : {})
      }))
    }))
  }, null, 2);
}

/* Accepte l'export complet, un tableau de catégories ou une seule catégorie.
   Renvoie des catégories normalisées sans id (l'appelant les fusionne). Lève une Error lisible sinon. */
export function parseCategories(json) {
  let data;
  try { data = typeof json === 'string' ? JSON.parse(json.replace(/^﻿/, '')) : json; }
  catch { throw new Error('Ce fichier n’est pas un JSON valide.'); }
  const raw = Array.isArray(data) ? data : Array.isArray(data?.categories) ? data.categories : data && typeof data === 'object' && 'questions' in data ? [data] : null;
  if (!raw) throw new Error('Aucune catégorie trouvée dans ce fichier.');
  const cats = raw.filter(c => c && typeof c === 'object').map(c => normalizeCategory({ name: c.name, questions: c.questions }));
  if (!cats.some(c => c.questions.length)) throw new Error('Aucune question valide (il faut au moins « question » et « answer »).');
  return cats.filter(c => c.questions.length).map(({ id, ...c }) => c);
}

/* ---------- Correction ---------- */
export const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, ' ').trim();
const ARTICLE = /^(le|la|les|l|un|une|des|du|de|d|the|a|an) /;
const core = s => norm(s).replace(ARTICLE, '');

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

const isNum = s => /^\s*[−-]?\d[\d\s]*([.,]\d+)?(\s*\/\s*\d+)?\s*$/.test(String(s));

/* 'ok' | 'typo' (accepté, orthographe à revoir) | 'ko' | 'empty' */
export function judgeText(answer, q) {
  const given = core(answer);
  if (!given) return 'empty';
  const goods = [q.answer, ...q.accepted];
  if (goods.some(g => isNum(g)) && isNum(answer)) {
    const v = parseAnswer(answer);
    if (goods.some(g => isNum(g) && Math.abs(parseAnswer(g) - v) < 1e-9)) return 'ok';
  }
  if (goods.some(g => core(g) === given)) return 'ok';
  if (goods.some(g => { const c = core(g); return !isNum(g) && c.length >= 4 && lev(c, given) <= (c.length >= 8 ? 2 : 1); })) return 'typo';
  return 'ko';
}

/* Mauvaises réponses : celles de la question, puis les réponses des autres questions. */
function makeChoices(q, pool, rng) {
  const out = [q.answer], seen = new Set([norm(q.answer), ...q.accepted.map(norm)]);
  const add = s => { const k = norm(s); if (out.length < 4 && k && !seen.has(k)) { seen.add(k); out.push(s); } };
  shuffle(q.wrong, rng).forEach(add);
  shuffle(pool.map(x => x.q.answer), rng).forEach(add);
  return out.length >= 2 ? shuffle(out, rng) : null;
}

const pool = themes => CATS.filter(c => themes?.includes(c.id))
  .flatMap(c => c.questions.map((q, i) => ({ c, q, i })));

const feedbackHTML = q => {
  const parts = [];
  if (q.accepted.length) parts.push(`<p class="mut">Aussi accepté : ${q.accepted.map(esc).join(', ')}</p>`);
  if (q.explanation) parts.push(`<p>${esc(q.explanation).replace(/\n/g, '<br>')}</p>`);
  return parts.join('');
};

export default {
  id: 'custom',
  name: 'Mes questions',
  short: 'Perso',
  get themes() { return CATS.map(c => ({ id: c.id, label: c.name, hint: `${c.questions.length} question${c.questions.length > 1 ? 's' : ''}` })); },
  modes: [{ id: 'qcm', label: 'Choix multiple' }, { id: 'saisie', label: 'Saisie libre' }],
  get defaults() { return { themes: CATS.map(c => c.id), count: 1, mode: 'qcm' }; },
  emptyHint: 'Aucune catégorie pour l’instant. Créez vos questions dans Réglages › Mes questions, ou importez un fichier JSON.',
  /* Faux si les catégories choisies ne contiennent aucune question. */
  available: ({ themes } = {}) => pool(themes).length > 0,
  generate({ themes, mode = 'qcm' } = {}, rng = Math.random) {
    const all = pool(themes);
    if (!all.length) throw new Error('Aucune question dans les catégories choisies');
    const { c, q, i } = all[Math.floor(rng() * all.length)];
    const choices = mode !== 'saisie' ? makeChoices(q, all.filter(x => x.q !== q), rng) : null;
    const reveal = () => ({ status: 'ko', title: `Réponse : ${esc(q.answer)}`, feedback: feedbackHTML(q), answer: q.answer });
    return {
      module: 'custom', theme: c.id, key: `custom:${c.id}:${i}`, raw: q,
      prompt: `<p class="q-lead">${esc(c.name)}</p><blockquote class="q-ex">${esc(q.question).replace(/\n/g, '<br>')}</blockquote>`,
      input: choices ? 'choice' : 'text',
      placeholder: 'Ta réponse…',
      choices,
      reveal,
      check(answer) {
        let r;
        if (choices) r = norm(answer) === norm(q.answer) ? 'ok' : 'ko';
        else {
          r = judgeText(answer, q);
          if (r === 'empty') return { status: 'retry', message: 'Écris une réponse, ou touche « Je ne sais pas ».' };
        }
        const ok = r !== 'ko';
        const note = r === 'typo' ? `<p>Attention à l’orthographe : on écrit <b>${esc(q.answer)}</b>.</p>` : '';
        return { status: ok ? 'ok' : 'ko', title: ok ? 'Bonne réponse !' : `Réponse : ${esc(q.answer)}`, feedback: note + feedbackHTML(q), answer: q.answer };
      }
    };
  }
};
