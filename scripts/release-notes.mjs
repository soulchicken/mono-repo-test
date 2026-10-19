import { execFileSync } from 'node:child_process'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const tags = new Set(git('tag', '--list').split('\n'))
const releases = []

for (const file of git('ls-tree', '-r', '--name-only', 'HEAD').split('\n')) {
  if (!/^(apps|packages)\/[^/]+\/package\.json$/.test(file)) continue
  const pkg = JSON.parse(git('show', `HEAD:${file}`))
  const tag = `${pkg.name}@${pkg.version}`
  if (pkg.version === '0.0.0' || !tags.has(tag)) continue

  const tagged = JSON.parse(git('show', `refs/tags/${tag}:${file}`))
  if (tagged.name !== pkg.name || tagged.version !== pkg.version) {
    throw new Error(`Package does not match tag: ${tag}`)
  }
  const changelog = git(
    'show',
    `refs/tags/${tag}:${file.replace(/package\.json$/, 'CHANGELOG.md')}`,
  )
  const sections = changelog.split(/^## /m)
  const entry = sections.find((section) => section.split('\n')[0].trim() === pkg.version)
  const body = entry?.split('\n').slice(1).join('\n').trim()
  if (!body) throw new Error(`Missing CHANGELOG entry for ${tag}`)
  releases.push({ tag, body })
}

console.log(JSON.stringify(releases))
