import assert from 'node:assert/strict'
import test from 'node:test'
import { testOptions } from './index.js'

test('shared test options use a positive timeout', () => {
  assert.ok(testOptions.timeout > 0)
})
