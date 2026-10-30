import test from 'node:test';
import assert from 'node:assert/strict';
import { FIRST_ASK, SNOOZE, MAX_OMNIBOX_SESSIONS, initialRate, totalUses, shouldAsk, shouldSuggest, later, finish } from '../lib/rate.js';

test('asks after the 5th search, not before', () => {
  assert.equal(FIRST_ASK, 5);
  assert.equal(shouldAsk(initialRate(), 4), false);
  assert.equal(shouldAsk(initialRate(), 5), true);
  assert.equal(totalUses({ youtube: 3, amazon: 2 }), 5);
});

test('address bar row only for a few sessions', () => {
  const r = { ...initialRate(), omniboxShown: MAX_OMNIBOX_SESSIONS - 1 };
  assert.equal(shouldSuggest(r, 9), true);
  assert.equal(shouldSuggest({ ...r, omniboxShown: MAX_OMNIBOX_SESSIONS }, 9), false);
});

test('"Later" waits 20 more searches and re-allows the address bar row; done never asks again', () => {
  const r = later({ ...initialRate(), omniboxShown: 5 }, 12);
  assert.equal(r.askAt, 12 + SNOOZE);
  assert.equal(shouldAsk(r, 31), false);
  assert.equal(shouldSuggest(r, 32), true);
  assert.equal(shouldAsk(finish(r), 1000), false);
});
