import { pad2 } from './util.js';

/* Jours : 0 = lundi … 6 = dimanche (ordre de la maquette « L M M J V S D »). */
export const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export const dayIndex = date => (date.getDay() + 6) % 7;

/* Prochaine date de sonnerie strictement après `now`, ou null si l'alarme est désactivée. */
export function nextOccurrence(alarm, now = new Date()) {
  if (!alarm || !alarm.enabled) return null;
  const days = alarm.days || [];
  for (let k = 0; k <= 7; k++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k, alarm.hour, alarm.minute, 0, 0);
    if (d <= now) continue;
    if (!days.length || days.includes(dayIndex(d))) return d;
  }
  return null;
}

export const formatTime = (h, m) => `${h} : ${pad2(m)}`;

/* « dans 9 h 12 min », « dans 3 min », « dans moins d'une minute » */
export function formatUntil(ms) {
  const min = Math.ceil(ms / 60000);
  if (min <= 1) return 'dans moins d’une minute';
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  if (d) return `dans ${d} j ${h} h`;
  if (h) return `dans ${h} h${m ? ' ' + pad2(m) : ''}`;
  return `dans ${m} min`;
}

export function describeDays(days) {
  const s = [...(days || [])].sort((a, b) => a - b).join(',');
  if (!s) return 'Une seule fois';
  if (s === '0,1,2,3,4,5,6') return 'Tous les jours';
  if (s === '0,1,2,3,4') return 'En semaine';
  if (s === '5,6') return 'Le week-end';
  return days.slice().sort((a, b) => a - b).map(i => DAY_NAMES[i].slice(0, 3) + '.').join(' ');
}
