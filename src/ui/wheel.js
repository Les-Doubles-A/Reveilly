/* Roue de sélection défilante (heures / minutes), en boucle, utilisable au clavier. */
const COPIES = 5, MID = 2;

export function mountWheel(el, { count, value, label, unit, onChange }) {
  el.className = 'wheel';
  el.tabIndex = 0;
  el.setAttribute('role', 'spinbutton');
  el.setAttribute('aria-label', label);
  el.setAttribute('aria-valuemin', 0);
  el.setAttribute('aria-valuemax', count - 1);
  el.innerHTML = `<div class="wheel-track">${Array.from({ length: COPIES * count }, (_, i) =>
    `<div class="wheel-item" aria-hidden="true">${unit === 'min' ? String(i % count).padStart(2, '0') : i % count}</div>`).join('')}</div>`;
  const items = [...el.querySelectorAll('.wheel-item')];
  const ih = () => items[0].offsetHeight || 64;
  let current = value, timer, lastSel;

  const setAria = v => { el.setAttribute('aria-valuenow', v); el.setAttribute('aria-valuetext', `${v} ${unit === 'min' ? 'minutes' : 'heures'}`); };
  const highlight = () => {
    const i = Math.round(el.scrollTop / ih());
    if (lastSel !== i) { items[lastSel]?.classList.remove('sel'); items[i]?.classList.add('sel'); lastSel = i; }
  };
  const jump = v => { el.scrollTop = (MID * count + v) * ih(); highlight(); };
  const settle = () => {
    const i = Math.round(el.scrollTop / ih()), v = ((i % count) + count) % count;
    if (i < count || i >= (COPIES - 1) * count) jump(v);
    if (v !== current) { current = v; setAria(v); onChange(v); }
  };
  el.addEventListener('scroll', () => { highlight(); clearTimeout(timer); timer = setTimeout(settle, 140); }, { passive: true });
  el.addEventListener('keydown', e => {
    const d = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 }[e.key];
    if (!d) return;
    e.preventDefault();
    el.scrollTo({ top: el.scrollTop + d * ih(), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  items.forEach((it, i) => it.addEventListener('click', () => el.scrollTo({ top: i * ih(), behavior: 'smooth' })));
  setAria(value);
  requestAnimationFrame(() => jump(value));
  return { get value() { return current; }, set(v) { current = v; setAria(v); jump(v); } };
}
