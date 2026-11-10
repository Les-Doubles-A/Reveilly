/* Pont vers le plugin Android « ReveillyAlarm » (android/app/src/main/java/app/reveilly). */
import { registerPlugin } from '@capacitor/core';

const P = registerPlugin('ReveillyAlarm');

/* Ce que le natif doit savoir pour sonner et se reprogrammer seul. */
const toNative = a => ({
  id: a.id, label: a.label || 'Réveil', hour: a.hour, minute: a.minute, days: a.days, enabled: a.enabled,
  sound: a.sound.kind === 'file' ? a.sound.uri || '' : a.sound.kind, volume: a.volume, vibrate: a.vibrate
});

export function createNativePlatform() {
  return {
    kind: 'android',
    init(cb) {
      P.addListener('ringing', r => cb(r));
      document.addEventListener('visibilitychange', async () => {
        if (document.hidden) return;
        const r = await P.getRinging().catch(() => null);
        if (r?.alarmId) cb(r);
      });
    },
    sync: (alarms, settings) => P.sync({ alarms: alarms.map(toNative), settings }),
    async getRinging() { const r = await P.getRinging(); return r?.alarmId ? r : null; },
    async consumeFired() { return (await P.consumeFired()).ids || []; },
    stopRinging: id => P.stopRinging({ id }),
    async pauseRinging(seconds) { const r = await P.pauseRinging({ seconds }); return r?.paused !== false; },
    scheduleTest: (seconds, alarm) => P.scheduleTest({ seconds, alarm: toNative(alarm) }),
    async pickSound() { const r = await P.pickSound(); return r?.uri ? { kind: 'file', uri: r.uri, name: r.name } : null; },
    preview: (sound, volume) => P.previewSound({ sound: sound.kind === 'file' ? sound.uri : sound.kind, volume }),
    stopPreview: () => P.stopPreview(),
    async permissions() {
      const r = await P.getStatus();
      return [
        { id: 'exact', label: 'Alarmes à l’heure exacte', ok: r.exactAlarm },
        { id: 'notifications', label: 'Notifications', ok: r.notifications },
        { id: 'fullscreen', label: 'Affichage sur l’écran verrouillé', ok: r.fullScreen },
        { id: 'battery', label: 'Pas de restriction de batterie', ok: r.batteryUnrestricted, optional: true }
      ];
    },
    openSettings: what => P.openSettings({ what }),
    haptic(ms = 12) { try { navigator.vibrate?.(ms); } catch {} }
  };
}
