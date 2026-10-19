import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { testOptions } from '@sample/config'

test('demo includes a documentation link built with the shared UI', testOptions, () => {
  const page = JSON.parse(
    execFileSync(process.execPath, [fileURLToPath(new URL('./demo.js', import.meta.url))], {
      encoding: 'utf8',
    }),
  )
  assert.deepEqual(page.documentation, {
    type: 'link',
    label: '실습 안내',
    href: 'https://github.com/soulchicken/mono-repo-test#readme',
  })
  assert.equal(page.action.label, '시작하기')
})
