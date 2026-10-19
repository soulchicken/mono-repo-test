import assert from 'node:assert/strict'
import test from 'node:test'
import { testOptions } from '@sample/config'
import { home } from './index.js'

test('home uses the shared UI button', testOptions, () => {
  const page = home()
  assert.equal(page.title, 'Changesets Playground')
  assert.equal(page.action.type, 'button')
  assert.equal(page.action.label, '시작하기')
})
