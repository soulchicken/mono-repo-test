import assert from 'node:assert/strict'
import test from 'node:test'
import { testOptions } from '@sample/config'
import { button } from './index.js'

test('button keeps its label', testOptions, () => {
  const result = button('확인')
  assert.equal(result.type, 'button')
  assert.equal(result.label, '확인')
})

test('button supports an optional variant without changing existing arguments', testOptions, () => {
  assert.equal(button('확인').variant, 'primary')
  assert.equal(button('취소', 'secondary').variant, 'secondary')
})

test('button uses the primary variant when null is passed', testOptions, () => {
  assert.equal(button('확인', null).variant, 'primary')
})
