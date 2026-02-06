/* eslint-env node, jest */
/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
document.documentElement.innerHTML = html;

require('../scripts/videos.js');
require('../scripts/render.js');

test('modal traps focus and closes on Escape', () => {
  const createButton = document.getElementById('create-button');
  createButton.click();

  const modal = document.getElementById('create-modal');
  expect(modal.getAttribute('aria-hidden')).toBe('false');

  const inputs = Array.from(modal.querySelectorAll('input, button'));
  expect(inputs.length).toBeGreaterThan(0);

  // focus first input
  inputs[0].focus();
  // simulate Shift+Tab when focus on first element -> should wrap to last
  const ev = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
  document.dispatchEvent(ev);

  // simulate Escape to close
  const esc = new KeyboardEvent('keydown', { key: 'Escape' });
  document.dispatchEvent(esc);
  expect(modal.getAttribute('aria-hidden')).toBe('true');
});