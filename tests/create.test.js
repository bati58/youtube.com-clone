/* eslint-env node, jest */
/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
document.documentElement.innerHTML = html;

require('../scripts/videos.js');
require('../scripts/render.js');

test('open create modal and add video', () => {
  const createButton = document.getElementById('create-button');
  expect(createButton).not.toBeNull();

  createButton.click();

  const modal = document.getElementById('create-modal');
  expect(modal.getAttribute('aria-hidden')).toBe('false');

  const titleInput = document.getElementById('create-title-input');
  const hrefInput = document.getElementById('create-href-input');
  const submit = document.getElementById('create-submit');

  titleInput.value = 'Test Video';
  hrefInput.value = 'https://www.youtube.com/watch?v=WWXLD8vT2_4';
  titleInput.dispatchEvent(new Event('input'));
  hrefInput.dispatchEvent(new Event('input'));

  submit.click();

  // after submit, modal should be closed
  expect(modal.getAttribute('aria-hidden')).toBe('true');

  // the grid should have the new video as first item
  const grid = document.getElementById('video-grid');
  expect(grid.firstElementChild).not.toBeNull();
  expect(grid.firstElementChild.querySelector('.video-title').textContent).toContain('Test Video');
});