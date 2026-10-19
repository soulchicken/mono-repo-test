import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('release notes use only the tagged version entry and reject invalid release data', (t) => {
  const repo = mkdtempSync(path.join(os.tmpdir(), 'sample-release-notes-'))
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  const git = (...args) =>
    execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: 'pipe' }).trim()
  const write = (file, contents) => {
    mkdirSync(path.dirname(path.join(repo, file)), { recursive: true })
    writeFileSync(path.join(repo, file), contents)
  }
  const commit = () => {
    git('add', '.')
    git('commit', '-qm', 'Fixture')
  }
  const inspect = () =>
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL('./release-notes.mjs', import.meta.url))],
      { cwd: repo, encoding: 'utf8', stdio: 'pipe' },
    )

  git('init', '-q', '-b', 'main')
  git('config', 'user.name', 'Release Test')
  git('config', 'user.email', 'release@example.invalid')
  git('config', 'core.hooksPath', '.git/hooks')
  write('package.json', JSON.stringify({ name: 'root', version: '1.0.0' }))
  write('packages/ui/package.json', JSON.stringify({ name: '@sample/ui', version: '0.1.0' }))
  write(
    'packages/config/package.json',
    JSON.stringify({ name: '@sample/config', version: '0.0.0' }),
  )
  write('apps/web/package.json', JSON.stringify({ name: '@sample/web', version: '0.0.1' }))
  write(
    'packages/ui/CHANGELOG.md',
    '# UI\r\n\r\n## 0.1.0\r\n\r\n### Minor Changes\r\n\r\n- New button\r\n\r\n## 0.0.1\r\n\r\n- Older change\r\n',
  )
  commit()
  assert.deepEqual(JSON.parse(inspect()), [])
  git('tag', '@sample/ui@0.1.0')
  git('tag', '@sample/config@0.0.0')
  const expected = [{ tag: '@sample/ui@0.1.0', body: '### Minor Changes\r\n\r\n- New button' }]
  assert.deepEqual(JSON.parse(inspect()), expected)

  // Later changes to the working branch must not alter the published notes.
  write('packages/ui/CHANGELOG.md', '# UI\n\n## 0.1.0\n\nEdited after tagging\n')
  commit()
  assert.deepEqual(JSON.parse(inspect()), expected)

  write('packages/ui/CHANGELOG.md', '# UI\n\n## 0.1.0\n\n## 0.0.1\n\nOlder change\n')
  commit()
  git('tag', '-f', '@sample/ui@0.1.0')
  assert.throws(inspect, /Missing CHANGELOG entry/)
  write('packages/ui/package.json', JSON.stringify({ name: '@sample/ui', version: '0.2.0' }))
  commit()
  git('tag', '-f', '@sample/ui@0.1.0')
  write('packages/ui/package.json', JSON.stringify({ name: '@sample/ui', version: '0.1.0' }))
  commit()
  assert.throws(inspect, /Package does not match tag/)
})
