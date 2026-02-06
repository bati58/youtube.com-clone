/* eslint-env node, jest */
/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
document.documentElement.innerHTML = html;

require('../scripts/videos.js');
require('../scripts/render.js');

test('renders video grid with items', () => {
  const grid = document.getElementById('video-grid');
  expect(grid).not.toBeNull();

  // The render script self-executes during require; just assert there are child nodes
  expect(grid.innerHTML.length).toBeGreaterThan(0);
});
