/* Volume progressif : de 10 % au volume choisi en `rampSeconds` (même courbe côté natif). */
export function rampVolume(target, elapsedSec, rampSeconds) {
  if (!rampSeconds || elapsedSec >= rampSeconds) return target;
  const start = Math.min(0.1, target);
  return start + (target - start) * Math.max(0, elapsedSec) / rampSeconds;
}

/* Volume réellement joué : réglage de l'alarme × volume général des Réglages. */
export const effectiveVolume = (alarmVolume, settings) => Math.max(0.02, Math.min(1, alarmVolume * (settings?.masterVolume ?? 1)));

export const BUILTIN_SOUNDS = [
  { kind: 'default', name: 'Sonnerie du téléphone' },
  { kind: 'melodie', name: 'Mélodie Reveilly' },
  { kind: 'bips', name: 'Bips' }
];
export const soundName = s => s?.kind === 'file' ? (s.name || 'Fichier') : (BUILTIN_SOUNDS.find(b => b.kind === s?.kind)?.name || BUILTIN_SOUNDS[0].name);
