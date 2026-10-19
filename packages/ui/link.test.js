import assert from 'node:assert/strict'
import test from 'node:test'
import { testOptions } from '@sample/config'
import { link } from './link.js'

test('link keeps its label and destination', testOptions, () => {
  assert.deepEqual(link('사용법', '/docs'), { type: 'link', label: '사용법', href: '/docs' })
})
