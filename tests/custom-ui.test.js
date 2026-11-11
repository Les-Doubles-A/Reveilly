// @vitest-environment jsdom
import { it, expect } from 'vitest';
import { createStore, newAlarm } from '../src/core/store.js';
import { renderSettings } from '../src/ui/settings.js';
import { renderCategory } from '../src/ui/category.js';
import { renderEdit } from '../src/ui/edit.js';
import { renderRing } from '../src/ui/ring.js';

const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const platform = { kind: 'web', permissions: async () => [], stopPreview() {}, openTextFile: async () => JSON.stringify([{ name: 'Capitales', questions: [{ question: 'Japon ?', answer: 'Tokyo' }, { question: 'Italie ?', answer: 'Rome' }] }]), saveTextFile: async () => true };
Element.prototype.scrollIntoView = () => {};
const tick =() => new Promise(r => setTimeout(r, 10));

it('parcours complet', async () => {
  const store = createStore(mem()), root = document.createElement('div'); document.body.appendChild(root);
  let view = null;
  const app = { haptic() {}, settings: () => { view = 'settings'; renderSettings(root, { store, app, platform }); }, category: id => { view = 'category'; renderCategory(root, { store, app, platform, id }); }, refresh: () => app[view](), list() {} };
  app.settings(); await tick();
  root.querySelector('#import').click(); await tick();
  expect(store.categories()[0].questions).toHaveLength(2);
  expect(root.querySelectorAll('[data-cat]')).toHaveLength(1);
  root.querySelector('#newcat').click();
  root.querySelector('#cname').value = 'Maths';
  root.querySelector('#save').click();
  expect(root.querySelector('#err').textContent).toMatch(/au moins une question/);
  const ta = root.querySelector('[data-f="question"]'); ta.value = '2+2 ?'; ta.dispatchEvent(new Event('input', { bubbles: true }));
  root.querySelector('#save').click();
  expect(root.querySelector('#err').textContent).toMatch(/Question 1/);
  const an = root.querySelector('[data-f="answer"]'); an.value = '4'; an.dispatchEvent(new Event('input', { bubbles: true }));
  root.querySelector('#save').click();
  expect(view).toBe('settings');
  expect(store.categories().map(c => c.name)).toEqual(['Capitales', 'Maths']);
  renderEdit(root, { store, app, platform, id: null });
  expect(root.querySelector('.mod[data-m="custom"] .themes').textContent).toMatch(/Capitales/);
  const a = newAlarm(); a.challenge.math.on = false; a.challenge.custom = { on: true, themes: store.categories().map(c => c.id), count: 2, mode: 'qcm' };
  renderRing(root, { alarm: a, test: false, app, onDone() {} });
  expect(root.querySelectorAll('.choices button').length).toBeGreaterThanOrEqual(2);
});
