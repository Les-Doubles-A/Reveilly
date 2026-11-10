/* Écran E3 : réglages généraux, état des permissions, test du réveil. */
import { esc } from '../core/util.js';
import { $, $$, ICON, toggle, toast } from './dom.js';

const RAMPS = [[0, 'Non'], [15, '15 s'], [30, '30 s'], [60, '1 min']];
const IDLES = [[0, 'Non'], [10, '10 s'], [20, '20 s'], [30, '30 s']];
const MAXES = [[5, '5 min'], [15, '15 min'], [30, '30 min'], [0, 'Jamais']];

export async function renderSettings(root, { store, app, platform }) {
  const st = store.settings();
  root.innerHTML = `<main class="screen settings">
    <header class="top"><h1>Réglages</h1></header>
    <section class="group"><h2>Sonnerie</h2>
      <div class="field"><label for="master">Volume général</label>
        <div class="sound-row"><button type="button" class="icon-btn" id="mplay" aria-label="Écouter">${ICON.play}</button>
          <input type="range" id="master" min="10" max="100" step="5" value="${Math.round((st.masterVolume ?? 1) * 100)}" aria-describedby="masterval"><b id="masterval" class="vol-val">${Math.round((st.masterVolume ?? 1) * 100)} %</b></div>
        <small>S’applique à toutes les alarmes, en plus du volume propre à chaque alarme.</small></div>
      <div class="field"><span>Volume progressif</span><div class="seg" role="group" aria-label="Volume progressif">${RAMPS.map(([v, l]) => `<button type="button" data-ramp="${v}" aria-pressed="${st.rampSeconds === v}">${l}</button>`).join('')}</div>
        <small>Le son part de 10 % et monte jusqu’au volume de l’alarme.</small></div>
      <div class="field"><span>Arrêt automatique sans réponse</span><div class="seg" role="group" aria-label="Arrêt automatique">${MAXES.map(([v, l]) => `<button type="button" data-max="${v}" aria-pressed="${st.maxRingMinutes === v}">${l}</button>`).join('')}</div>
        <small id="maxhint">${st.maxRingMinutes ? 'Au-delà, la sonnerie s’arrête d’elle-même.' : 'La sonnerie continue jusqu’à la bonne réponse.'}</small></div>
      <div class="field"><span>Silence pendant les réponses</span><div class="seg" role="group" aria-label="Silence pendant les réponses">${IDLES.map(([v, l]) => `<button type="button" data-idle="${v}" aria-pressed="${st.idleSeconds === v}">${l}</button>`).join('')}</div>
        <small id="idlehint">${idleHint(st.idleSeconds)}</small></div>
      <div class="field row"><span>Retour haptique</span>${toggle(st.haptics, 'Retour haptique', 'id="hap"')}</div>
    </section>
    <section class="group"><h2>Fiabilité</h2><ul class="perms" id="perms"><li class="mut">Vérification…</li></ul></section>
    <section class="group"><h2>Essayer</h2>
      <button type="button" class="save" id="test">Tester un réveil dans 10 s</button>
      <small>Une question, avec les modules de votre première alarme. Verrouillez le téléphone pour vérifier l’affichage.</small></section>
    <section class="group about"><img src="logo.png" alt="" width="48" height="47"><div><b>Reveilly</b> 1.0<br><span class="mut">Réveil à questions · fonctionne hors ligne, aucune donnée ne quitte l’appareil.</span></div></section>
  </main>`;

  let mplaying = false;
  const mstop = () => { mplaying = false; platform.stopPreview(); $('#mplay', root).innerHTML = ICON.play; $('#mplay', root).setAttribute('aria-label', 'Écouter'); };
  $('#master', root).oninput = e => {
    const v = e.target.value / 100;
    $('#masterval', root).textContent = `${e.target.value} %`;
    store.saveSettings({ masterVolume: v });
    if (mplaying) platform.preview({ kind: 'default' }, v).catch(() => {});
  };
  $('#mplay', root).onclick = async () => {
    if (mplaying) return mstop();
    mplaying = true; $('#mplay', root).innerHTML = ICON.stop; $('#mplay', root).setAttribute('aria-label', 'Arrêter l’écoute');
    try { await platform.preview({ kind: 'default' }, store.settings().masterVolume ?? 1); } catch { mstop(); }
    setTimeout(() => mplaying && mstop(), 6000);
  };
  $$('[data-ramp]', root).forEach(b => b.onclick = () => { store.saveSettings({ rampSeconds: +b.dataset.ramp }); $$('[data-ramp]', root).forEach(x => x.setAttribute('aria-pressed', x === b)); app.haptic(); });
  $$('[data-max]', root).forEach(b => b.onclick = () => {
    store.saveSettings({ maxRingMinutes: +b.dataset.max }); $$('[data-max]', root).forEach(x => x.setAttribute('aria-pressed', x === b)); app.haptic();
    $('#maxhint', root).textContent = +b.dataset.max ? 'Au-delà, la sonnerie s’arrête d’elle-même.' : 'La sonnerie continue jusqu’à la bonne réponse.';
  });
  $$('[data-idle]', root).forEach(b => b.onclick = () => {
    store.saveSettings({ idleSeconds: +b.dataset.idle }); $$('[data-idle]', root).forEach(x => x.setAttribute('aria-pressed', x === b)); app.haptic();
    $('#idlehint', root).textContent = idleHint(+b.dataset.idle);
  });
  $('#hap', root).onclick = e => { const on = !store.settings().haptics; store.saveSettings({ haptics: on }); e.currentTarget.setAttribute('aria-checked', on); app.haptic(); };
  $('#test', root).onclick = async () => {
    await app.scheduleTest(10);
    toast('Réveil de test dans 10 secondes…');
  };

  const perms = await platform.permissions().catch(() => []);
  const ul = $('#perms', root);
  if (!ul) return;
  ul.innerHTML = perms.map(p => `<li class="${p.ok ? 'ok' : p.info ? 'info' : p.optional ? 'opt' : 'bad'}">
    <span class="dot">${p.ok ? ICON.check : ICON.warn}</span><span class="pl">${esc(p.label)}${!p.ok && p.optional ? '<small>Recommandé sur certains téléphones (Xiaomi, Samsung…)</small>' : ''}</span>
    ${!p.ok && !p.info ? `<button type="button" class="lnk" data-fix="${p.id}">Corriger</button>` : ''}</li>`).join('') || '<li class="mut">Indisponible</li>';
  $$('[data-fix]', ul).forEach(b => b.onclick = () => platform.openSettings(b.dataset.fix));
}

const idleHint = s => s
  ? `La sonnerie se tait dès que vous touchez l’écran et reprend après ${s} s sans activité.`
  : 'La sonnerie continue pendant que vous répondez.';
