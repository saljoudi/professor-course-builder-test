import test from 'node:test';
import assert from 'node:assert/strict';
import { makePublicId, makeRenderServiceName, slugify } from '../apps/api/src/utils/id.js';

test('public IDs are 8 characters and avoid ambiguous characters', () => {
  const id = makePublicId();
  assert.equal(id.length, 8);
  assert.match(id, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]+$/);
});

test('render names are lowercase and include public ID', () => {
  assert.equal(makeRenderServiceName('Biostatistics & Health!', '7KQ4M2AB'), 'biostatistics-health-7kq4m2ab');
});

test('slugify returns course for empty values', () => assert.equal(slugify(''), 'course'));
