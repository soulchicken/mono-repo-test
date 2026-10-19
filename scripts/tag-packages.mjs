import { execFileSync } from 'node:child_process'
import path from 'node:path'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const root = process.cwd()
const packages = JSON.parse(
  execFileSync('pnpm', ['-r', 'list', '--depth', '-1', '--json'], { encoding: 'utf8' }),
)
const existingTags = new Set(git('tag', '--list').split('\n'))
const tags = []

for (const pkg of packages) {
  if (pkg.path === root || pkg.version === '0.0.0') continue

  const tag = `${pkg.name}@${pkg.version}`
  if (!existingTags.has(tag)) {
    const manifest = path
      .relative(root, path.join(pkg.path, 'package.json'))
      .split(path.sep)
      .join('/')
    const commits = git('log', '--first-parent', '--format=%H', '--diff-filter=M', '--', manifest)
      .split('\n')
      .filter(Boolean)
    const releaseCommit = commits.find((commit) => {
      const current = JSON.parse(git('show', `${commit}:${manifest}`))
      const previous = JSON.parse(git('show', `${commit}^:${manifest}`))
      return current.version === pkg.version && previous.version !== pkg.version
    })
    if (!releaseCommit) continue

    git('tag', '--annotate', '--message', tag, tag, releaseCommit)
    console.log(`Created ${tag} at ${releaseCommit}`)
  }
  tags.push(`refs/tags/${tag}`)
}

if (tags.length > 0) {
  // Push only this release's tags; retrying also recovers a previous failed push.
  execFileSync('git', ['push', '--atomic', 'origin', ...tags], { stdio: 'inherit' })
} else {
  console.log('No released package versions to tag.')
}
