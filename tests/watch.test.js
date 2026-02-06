/* eslint-env node, jest */
/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'watch.html'), 'utf8');
document.documentElement.innerHTML = html;

require('../scripts/videos.js');
require('../scripts/watch.js');

test('watch page loads video data for known id', () => {
  // set query string
  window.history.pushState({}, 'test', '/watch.html?id=v001');
  // re-require script to run initialization
  jest.resetModules();
  require('../scripts/videos.js');
  require('../scripts/watch.js');

  const title = document.getElementById('video-title');
  expect(title).not.toBeNull();
  expect(title.textContent.length).toBeGreaterThan(0);
});
