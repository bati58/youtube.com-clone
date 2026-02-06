/* eslint-env node, jest */
/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
document.documentElement.innerHTML = html;

require('../scripts/videos.js');
require('../scripts/render.js');

beforeEach(() => {
  global.fetch = jest.fn();
});

test('pushVideosToGitHub creates or updates file', async () => {
  // simulate GET returning 404 (file missing), and PUT returns 201
  global.fetch
    .mockResolvedValueOnce({ status: 404 })
    .mockResolvedValueOnce({ status: 201, json: async () => ({ content: { sha: 'abc' } }) });

  const token = 'fake-token';
  const fn = global.window.pushVideosToGitHub || require('../scripts/render.js').pushVideosToGitHub;

  // call internal helper
  const res = await fn(token, { owner: 'bati58', repo: 'youtube.com-clone', path: 'data/videos.json' });
  expect(res).toBe(true);

  expect(global.fetch).toHaveBeenCalledTimes(2);
  const putCall = global.fetch.mock.calls[1];
  const url = putCall[0];
  const options = putCall[1];
  expect(url).toContain('/repos/bati58/youtube.com-clone/contents/data/videos.json');
  expect(options.method).toBe('PUT');
  const body = JSON.parse(options.body);
  expect(body).toHaveProperty('message');
  expect(body).toHaveProperty('content');
});