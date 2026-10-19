import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('pushes released package tags, skips initial and unchanged versions, and preserves existing tags', (t) => {
  const fixture = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'gdg-tags-')))
  t.after(() => rmSync(fixture, { recursive: true, force: true }))
  const repo = path.join(fixture, 'repo')
  const remote = path.join(fixture, 'remote.git')
  mkdirSync(repo)
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim()
  const writePackage = (dir, name, version) => {
    mkdirSync(path.join(repo, dir), { recursive: true })
    writeFileSync(
      path.join(repo, dir, 'package.json'),
      JSON.stringify({ name, version, private: true }),
    )
  }
  const commit = () => {
    git('add', '.')
    git('commit', '-qm', 'Fixture')
  }
  const run = () =>
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL('./tag-packages.mjs', import.meta.url))],
      { cwd: repo },
    )
  const remoteTags = () => git('ls-remote', '--tags', 'origin')

  git('init', '-q', '-b', 'main')
  git('config', 'user.name', 'Tag Test')
  git('config', 'user.email', 'tags@example.invalid')
  git('config', 'core.hooksPath', '.git/hooks')
  git('init', '--bare', '-q', remote)
  git('remote', 'add', 'origin', remote)
  writeFileSync(
    path.join(repo, 'pnpm-workspace.yaml'),
    "packages:\n  - 'apps/*'\n  - 'packages/*'\n",
  )
  writePackage('.', 'root', '9.9.8')
  writePackage('apps/web', '@sample/web', '0.0.0')
  writePackage('packages/wowds', '@sample/wowds', '0.0.0')
  writePackage('packages/config', '@sample/config', '0.0.1')
  writePackage('packages/unchanged', '@sample/unchanged', '1.0.0')
  commit()
  git('checkout', '-qb', 'develop')
  git('checkout', '-qb', 'changeset-release/develop')
  writePackage('.', 'root', '9.9.9')
  writePackage('apps/web', '@sample/web', '0.0.1')
  writePackage('packages/wowds', '@sample/wowds', '0.1.0')
  writePackage('packages/config', '@sample/config', '0.0.0')
  commit()
  git('checkout', '-q', 'develop')
  git('merge', '--no-ff', '--no-edit', 'changeset-release/develop')
  const preparedCommit = git('rev-parse', 'HEAD')
  git('checkout', '-q', 'main')
  git('merge', '--no-ff', '--no-edit', 'develop')
  const releaseCommit = git('rev-parse', 'HEAD')
  git('tag', '-a', '-m', 'Unrelated local tag', 'unrelated', 'HEAD')
  git('tag', '-a', '-m', 'Existing tag', '@sample/wowds@0.1.0', 'HEAD^')
  const existingTag = git('rev-parse', 'refs/tags/@sample/wowds@0.1.0')
  const manifest = readFileSync(path.join(repo, 'apps/web/package.json'), 'utf8')

  // A newer main push may cancel the release CI before it can create tags.
  writeFileSync(path.join(repo, 'README.md'), 'New push before release CI completes\n')
  commit()
  run()
  assert.equal(git('rev-parse', '@sample/web@0.0.1^{}'), releaseCommit)
  assert.notEqual(git('rev-parse', '@sample/web@0.0.1^{}'), preparedCommit)
  assert.equal(git('cat-file', '-t', 'refs/tags/@sample/web@0.0.1'), 'tag')
  assert.equal(git('rev-parse', 'refs/tags/@sample/wowds@0.1.0'), existingTag)
  assert.deepEqual(git('tag', '--list').split('\n'), [
    '@sample/web@0.0.1',
    '@sample/wowds@0.1.0',
    'unrelated',
  ])
  assert.ok(!remoteTags().includes('refs/tags/unrelated'))
  assert.ok(remoteTags().includes(`refs/tags/@sample/web@0.0.1^{}`))
  assert.ok(remoteTags().includes(existingTag))
  assert.equal(readFileSync(path.join(repo, 'apps/web/package.json'), 'utf8'), manifest)
  const tags = remoteTags()
  run()
  assert.equal(remoteTags(), tags)

  // Recover an interrupted push when the annotated tag already exists locally.
  git('push', 'origin', ':refs/tags/@sample/web@0.0.1')
  run()
  assert.equal(remoteTags(), tags)

  writeFileSync(path.join(repo, 'README.md'), 'Documentation only\n')
  commit()
  run()
  assert.equal(remoteTags(), tags)

  const unchangedManifest = path.join(repo, 'packages/unchanged/package.json')
  writeFileSync(
    unchangedManifest,
    JSON.stringify({
      ...JSON.parse(readFileSync(unchangedManifest, 'utf8')),
      description: 'Metadata',
    }),
  )
  commit()
  run()
  assert.equal(remoteTags(), tags)
})
