import assert from 'node:assert/strict'
import test from 'node:test'
import { testOptions } from '@sample/config'
import { button } from './index.js'

test('button keeps its label', testOptions, () => {
  const result = button('확인')
  assert.equal(result.type, 'button')
  assert.equal(result.label, '확인')
})
