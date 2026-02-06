/* eslint-env node, jest */
/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
document.documentElement.innerHTML = html;

require('../scripts/videos.js');
const _renderModule = require('../scripts/render.js');

// mock FileReader
class MockFileReader {
  constructor() {
    this.onload = null;
    this.result = null;
  }
  readAsDataURL() {
    // pretend to read and call onload
    this.result = 'data:image/png;base64,TEST';
    if (typeof this.onload === 'function') this.onload({ target: this });
  }
}

global.FileReader = MockFileReader;

test('upload thumbnail and create video uses data URL', () => {
  const fileInput = document.getElementById('create-thumbnail-file');
  const createButton = document.getElementById('create-button');
  createButton.click();

  const titleInput = document.getElementById('create-title-input');
  const hrefInput = document.getElementById('create-href-input');
  const submit = document.getElementById('create-submit');

  // simulate file
  const fakeFile = new Blob(['x'], { type: 'image/png' });
  Object.defineProperty(fileInput, 'files', { value: [fakeFile] });
  const ev = new Event('change');
  fileInput.dispatchEvent(ev); // eslint-disable-line no-unused-vars

  // fill form
  titleInput.value = 'Upload Thumb Video';
  hrefInput.value = 'https://www.youtube.com/watch?v=WWXLD8vT2_4';
  titleInput.dispatchEvent(new Event('input'));
  hrefInput.dispatchEvent(new Event('input'));

  submit.click();

  const grid = document.getElementById('video-grid');
  expect(grid.firstElementChild).not.toBeNull();
  const img = grid.firstElementChild.querySelector('.thumbnail');
  expect(img.src).toMatch(/^data:image/);
});