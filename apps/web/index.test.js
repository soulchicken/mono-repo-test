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

test('home accepts a custom title while keeping its shared button', testOptions, () => {
  const page = home('우리 팀 릴리스 실습')
  assert.equal(page.title, '우리 팀 릴리스 실습')
  assert.equal(page.action.label, '시작하기')
})
