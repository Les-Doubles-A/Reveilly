/* Aperçu Web : les alarmes ne sonnent que si la page reste ouverte.
   Sert à essayer l'interface et les défis sans installer l'APK. */
import { nextOccurrence } from '../core/time.js';
import { rampVolume, effectiveVolume } from '../core/audio.js';

const DB = 'reveilly-sounds';
const idb = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function idbPut(key, blob) { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('s', 'readwrite'); t.objectStore('s').put(blob, key); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function idbGet(key) { const db = await idb(); return new Promise((res, rej) => { const r = db.transaction('s').objectStore('s').get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }

export function createWebPlatform() {
  let onRing = () => {}, schedule = new Map(), alarms = [], settings = {}, ringing = null, fired = [];
  let audio = null, rampTimer = null, preview = null, maxTimer = null, resumeTimer = null;

  /* Moteur audio : Web Audio (le volume se règle partout, iOS compris) avec repli sur <audio>.
     La pause coupe le gain au lieu d'arrêter la lecture : la reprise ne demande donc aucun geste,
     ce que les navigateurs mobiles exigent pour relancer un son. */
  let ctx = null, gain = null, source = null, level = 0, muted = false;
  const buffers = new Map();
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  const unlock = () => {
    try { if (!ctx && AC) ctx = new AC(); if (ctx?.state === 'suspended') ctx.resume(); } catch {}
  };
  ['pointerdown', 'keydown', 'touchend'].forEach(t => document.addEventListener(t, unlock, { capture: true, passive: true }));

  async function blobFor(sound) {
    if (sound?.kind === 'file' && sound.ref) { try { const b = await idbGet(sound.ref); if (b) return b; } catch {} }
    return null;
  }
  const urlFor = sound => `sounds/${sound?.kind === 'bips' ? 'bips' : 'melodie'}.wav`;
  async function bufferFor(sound) {
    const key = sound?.kind === 'file' ? sound.ref : urlFor(sound);
    if (buffers.has(key)) return buffers.get(key);
    const blob = await blobFor(sound);
    const data = blob ? await blob.arrayBuffer() : await (await fetch(urlFor(sound))).arrayBuffer();
    const buf = await new Promise((res, rej) => ctx.decodeAudioData(data, res, rej));
    buffers.set(key, buf);
    return buf;
  }
  const apply = (smooth = true) => {
    const v = muted ? 0 : level;
    if (gain && ctx) { if (smooth) gain.gain.setTargetAtTime(v, ctx.currentTime, 0.03); else gain.gain.value = v; }
    if (audio) { audio.volume = Math.min(1, level); audio.muted = muted; }
  };
  async function play(sound, volume, ramp) {
    stopAudio();
    const token = {}; play.token = token;
    const t0 = Date.now();
    level = rampVolume(volume, 0, ramp); muted = false;
    unlock();
    try {
      if (!ctx) throw new Error('no AudioContext');
      const buf = await bufferFor(sound);
      if (play.token !== token) return;
      gain = ctx.createGain(); gain.gain.value = level; gain.connect(ctx.destination);
      source = ctx.createBufferSource(); source.buffer = buf; source.loop = true; source.connect(gain); source.start();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    } catch {
      if (play.token !== token) return;
      const blob = await blobFor(sound);
      audio = new Audio(blob ? URL.createObjectURL(blob) : urlFor(sound)); audio.loop = true;
      apply(false);
      audio.play().catch(() => { /* bloqué tant que la page n'a reçu aucun geste */ });
    }
    apply(false);
    if (ramp) rampTimer = setInterval(() => { level = rampVolume(volume, (Date.now() - t0) / 1000, ramp); apply(); }, 250);
  }
  function stopAudio() {
    play.token = null; clearInterval(rampTimer);
    if (source) { try { source.stop(); } catch {} source.disconnect(); source = null; }
    if (gain) { gain.disconnect(); gain = null; }
    if (audio) { audio.pause(); audio = null; }
    muted = false;
  }
  const setMuted = m => { muted = m; apply(); };

  function ring(alarm, test = false) {
    if (ringing) return;
    ringing = { alarmId: alarm.id, test, at: Date.now(), vibrate: alarm.vibrate };
    if (!test && !alarm.days.length) fired.push(alarm.id);
    play(alarm.sound, effectiveVolume(alarm.volume, settings), settings.rampSeconds);
    if (alarm.vibrate && navigator.vibrate) navigator.vibrate(VIBRATION);
    if (settings.maxRingMinutes) maxTimer = setTimeout(() => stop(), settings.maxRingMinutes * 60000);
    onRing({ ...ringing });
  }
  const VIBRATION = [600, 400, 600, 400, 600];
  function stop() { clearTimeout(maxTimer); clearTimeout(resumeTimer); stopAudio(); if (navigator.vibrate) navigator.vibrate(0); ringing = null; }

  function plan(now = new Date()) {
    schedule = new Map();
    for (const a of alarms) { const n = nextOccurrence(a, now); if (n) schedule.set(a.id, n.getTime()); }
  }
  setInterval(() => {
    const now = Date.now();
    for (const [id, t] of schedule) if (now >= t) {
      const a = alarms.find(x => x.id === id);
      schedule.delete(id);
      if (a) { ring(a); const n = a.days.length ? nextOccurrence(a, new Date(t + 1000)) : null; if (n) schedule.set(id, n.getTime()); }
    }
  }, 1000);

  return {
    kind: 'web',
    init(cb) { onRing = cb; },
    async sync(list, s) { alarms = list; settings = s; plan(); },
    async getRinging() { return ringing ? { ...ringing } : null; },
    async consumeFired() { const f = fired; fired = []; return f; },
    async stopRinging() { stop(); },
    /* Coupe le son pendant que l'utilisateur répond ; il revient seul après `seconds` sans nouvel appel. */
    async pauseRinging(seconds) {
      if (!ringing) return false;
      setMuted(true); navigator.vibrate?.(0);
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        if (!ringing) return;
        setMuted(false);
        if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
        if (audio?.paused) audio.play().catch(() => {});
        if (ringing.vibrate) navigator.vibrate?.(VIBRATION);
      }, seconds * 1000);
      return true;
    },
    async scheduleTest(seconds, alarm) { setTimeout(() => ring(alarm, true), seconds * 1000); },
    pickSound() {
      return new Promise(resolve => {
        const i = Object.assign(document.createElement('input'), { type: 'file', accept: 'audio/*' });
        i.onchange = async () => {
          const f = i.files[0]; if (!f) return resolve(null);
          const ref = 'sound:' + Date.now();
          try { await idbPut(ref, f); resolve({ kind: 'file', ref, name: f.name.replace(/\.[^.]+$/, '') }); }
          catch { resolve(null); }
        };
        i.click();
      });
    },
    /* Fichiers texte (import / export des catégories). */
    async saveTextFile(name, text) {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return true;
    },
    openTextFile() {
      return new Promise((resolve, reject) => {
        const i = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json,text/plain' });
        i.onchange = () => {
          const f = i.files[0]; if (!f) return resolve(null);
          if (f.size > 2e6) return reject(new Error('Fichier trop volumineux (2 Mo maximum).'));
          f.text().then(resolve, reject);
        };
        i.click();
      });
    },
    async preview(sound, volume) { await play(sound, volume, 0); preview = setTimeout(stopAudio, 6000); },
    async stopPreview() { clearTimeout(preview); if (!ringing) stopAudio(); },
    async permissions() {
      return [{ id: 'web', label: 'Aperçu Web : gardez cette page ouverte pour que l’alarme sonne', ok: false, info: true }];
    },
    async openSettings() {},
    haptic(ms = 12) { try { navigator.vibrate?.(ms); } catch {} }
  };
}
